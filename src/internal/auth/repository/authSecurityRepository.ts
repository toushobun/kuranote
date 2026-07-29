import type { AuthOtpAttempt, AuthOtpPurpose } from "internal/auth/entity/auth";
import { RepositoryError } from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";
import { createServiceRoleSupabaseClient } from "internal/shared/supabase/serviceRoleClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";

export type AuthAttemptDimension = "email_hash" | "ip_hash";

export interface AuthSecurityRepository {
  countVerifyFailuresAfter(input: {
    emailHash: string;
    since: string;
  }): Promise<number>;
  findLatestSuccessfulSendAt(input: {
    emailHash: string;
    purpose: AuthOtpPurpose;
    since: string;
  }): Promise<string | null>;
  isRegisterEmailAvailable(email: string): Promise<boolean>;
  listAvailabilityCheckTimes(input: {
    ipHash: string;
    limit: number;
    purpose: AuthOtpPurpose;
    since: string;
  }): Promise<string[]>;
  listSuccessfulSendTimes(input: {
    dimension: AuthAttemptDimension;
    hash: string;
    limit: number;
    purpose: AuthOtpPurpose;
    since: string;
  }): Promise<string[]>;
  recordAttempt(attempt: AuthOtpAttempt): Promise<void>;
}

type ServiceRoleClient = ReturnType<typeof createServiceRoleSupabaseClient>;
type ServiceRoleClientFactory = () => ServiceRoleClient;

type CreatedAtRow = { created_at: string };

function isCreatedAtRow(value: unknown): value is CreatedAtRow {
  return (
    typeof value === "object" &&
    value !== null &&
    "created_at" in value &&
    typeof value.created_at === "string"
  );
}

function toCreatedAtRows(data: unknown): CreatedAtRow[] {
  if (!Array.isArray(data) || !data.every(isCreatedAtRow)) {
    throw toRepositoryError(
      "auth_attempt_rows_invalid",
      "认证安全记录格式异常，请稍后重试。",
    );
  }

  return data;
}

function toSafeUnexpectedErrorContext(error: unknown): { errorName: string } {
  return { errorName: error instanceof Error ? error.name : "unknown" };
}

function logAndThrow(
  logger: Logger,
  message: string,
  error: { code?: string | null } | null,
  repositoryCode: string,
  safeMessage: string,
): never {
  logger.error(message, { code: error?.code });
  throw toRepositoryError(repositoryCode, safeMessage);
}

async function withRepositoryBoundary<T>(
  logger: Logger,
  logMessage: string,
  repositoryCode: string,
  safeMessage: string,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof RepositoryError) throw error;

    logger.error(logMessage, toSafeUnexpectedErrorContext(error));
    throw toRepositoryError(repositoryCode, safeMessage);
  }
}

const attemptTable = "auth_otp_attempt";

export function createSupabaseAuthSecurityRepository(
  logger: Logger,
  createClient: ServiceRoleClientFactory = createServiceRoleSupabaseClient,
): AuthSecurityRepository {
  return {
    async countVerifyFailuresAfter(input) {
      return withRepositoryBoundary(
        logger,
        "[auth] OTP verification failure query crashed",
        "auth_attempt_count_failed",
        "验证码校验记录读取失败，请稍后重试。",
        async () => {
          const supabase = createClient();
          const { count, error } = await supabase
            .from(attemptTable)
            .select("id", { count: "exact", head: true })
            .eq("purpose", "signup")
            .eq("email_hash", input.emailHash)
            .eq("attempt_type", "verify_failure")
            .gt("created_at", input.since);

          if (error) {
            logAndThrow(
              logger,
              "[auth] failed to count OTP verification failures",
              error,
              "auth_attempt_count_failed",
              "验证码校验记录读取失败，请稍后重试。",
            );
          }

          return count ?? 0;
        },
      );
    },

    async findLatestSuccessfulSendAt(input) {
      return withRepositoryBoundary(
        logger,
        "[auth] latest OTP send query crashed",
        "auth_latest_send_load_failed",
        "验证码发送记录读取失败，请稍后重试。",
        async () => {
          const supabase = createClient();
          const { data, error } = await supabase
            .from(attemptTable)
            .select("created_at")
            .eq("purpose", input.purpose)
            .eq("email_hash", input.emailHash)
            .eq("attempt_type", "send")
            .eq("result", "success")
            .gte("created_at", input.since)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) {
            logAndThrow(
              logger,
              "[auth] failed to load latest OTP send",
              error,
              "auth_latest_send_load_failed",
              "验证码发送记录读取失败，请稍后重试。",
            );
          }

          if (data === null) return null;
          if (!isCreatedAtRow(data)) {
            throw toRepositoryError(
              "auth_latest_send_row_invalid",
              "验证码发送记录格式异常，请稍后重试。",
            );
          }

          return data.created_at;
        },
      );
    },

    async isRegisterEmailAvailable(email) {
      return withRepositoryBoundary(
        logger,
        "[auth] register email availability query crashed",
        "register_email_check_failed",
        "邮箱可用性检查失败，请稍后重试。",
        async () => {
          const normalizedEmail = email.trim().toLowerCase();
          const supabase = createClient();
          const { data, error } = await supabase.rpc("is_email_registered", {
            p_email: normalizedEmail,
          });

          if (error) {
            logAndThrow(
              logger,
              "[auth] failed to check register email availability",
              error,
              "register_email_check_failed",
              "邮箱可用性检查失败，请稍后重试。",
            );
          }

          if (typeof data !== "boolean") {
            throw toRepositoryError(
              "register_email_check_result_invalid",
              "邮箱可用性检查失败，请稍后重试。",
            );
          }

          return !data;
        },
      );
    },

    async listAvailabilityCheckTimes(input) {
      return withRepositoryBoundary(
        logger,
        "[auth] email availability attempt query crashed",
        "auth_availability_attempt_load_failed",
        "邮箱检查记录读取失败，请稍后重试。",
        async () => {
          const supabase = createClient();
          const { data, error } = await supabase
            .from(attemptTable)
            .select("created_at")
            .eq("purpose", input.purpose)
            .eq("attempt_type", "availability_check")
            .eq("ip_hash", input.ipHash)
            .gte("created_at", input.since)
            .order("created_at", { ascending: false })
            .limit(input.limit);

          if (error) {
            logAndThrow(
              logger,
              "[auth] failed to load email availability attempts",
              error,
              "auth_availability_attempt_load_failed",
              "邮箱检查记录读取失败，请稍后重试。",
            );
          }

          return toCreatedAtRows(data).map((row) => row.created_at);
        },
      );
    },

    async listSuccessfulSendTimes(input) {
      return withRepositoryBoundary(
        logger,
        "[auth] OTP send attempt query crashed",
        "auth_send_attempt_load_failed",
        "验证码发送记录读取失败，请稍后重试。",
        async () => {
          const supabase = createClient();
          const { data, error } = await supabase
            .from(attemptTable)
            .select("created_at")
            .eq("purpose", input.purpose)
            .eq("attempt_type", "send")
            .eq("result", "success")
            .eq(input.dimension, input.hash)
            .gte("created_at", input.since)
            .order("created_at", { ascending: false })
            .limit(input.limit);

          if (error) {
            logAndThrow(
              logger,
              "[auth] failed to load OTP send attempts",
              error,
              "auth_send_attempt_load_failed",
              "验证码发送记录读取失败，请稍后重试。",
            );
          }

          return toCreatedAtRows(data).map((row) => row.created_at);
        },
      );
    },

    async recordAttempt(attempt) {
      return withRepositoryBoundary(
        logger,
        "[auth] OTP attempt insert crashed",
        "auth_attempt_record_failed",
        "认证安全记录写入失败，请稍后重试。",
        async () => {
          const supabase = createClient();
          const { error } = await supabase.from(attemptTable).insert({
            attempt_type: attempt.attemptType,
            email_hash: attempt.emailHash,
            ip_hash: attempt.ipHash,
            purpose: attempt.purpose,
            result: attempt.result,
          });

          if (error) {
            logAndThrow(
              logger,
              "[auth] failed to record OTP attempt",
              error,
              "auth_attempt_record_failed",
              "认证安全记录写入失败，请稍后重试。",
            );
          }
        },
      );
    },
  };
}
