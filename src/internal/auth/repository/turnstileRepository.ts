import { getTurnstileSecretKey } from "internal/auth/turnstileKeys";
import { RepositoryError } from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";

export interface TurnstileRepository {
  verify(input: { remoteIp: string | null; token: string }): Promise<boolean>;
}

type TurnstileResponse = { success?: boolean };

function isTurnstileResponse(value: unknown): value is TurnstileResponse {
  return typeof value === "object" && value !== null;
}

function toSafeUnexpectedErrorContext(error: unknown): { errorName: string } {
  return { errorName: error instanceof Error ? error.name : "unknown" };
}

export function createCloudflareTurnstileRepository(
  logger: Logger,
  fetcher: typeof fetch = fetch,
): TurnstileRepository {
  return {
    async verify(input) {
      const secret = getTurnstileSecretKey();

      if (!secret || !input.token) return false;

      const body = new URLSearchParams({
        response: input.token,
        secret,
      });

      if (input.remoteIp) body.set("remoteip", input.remoteIp);

      try {
        const response = await fetcher(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          { body, method: "POST" },
        );

        if (!response.ok) {
          throw new RepositoryError(
            "turnstile_service_unavailable",
            "安全验证服务暂时不可用，请稍后重试。",
          );
        }

        const data: unknown = await response.json();
        if (!isTurnstileResponse(data)) {
          throw new RepositoryError(
            "turnstile_response_invalid",
            "安全验证服务暂时不可用，请稍后重试。",
          );
        }
        return data.success === true;
      } catch (error) {
        logger.warn(
          "[auth] Turnstile verification request failed",
          toSafeUnexpectedErrorContext(error),
        );
        if (error instanceof RepositoryError) throw error;
        throw new RepositoryError(
          "turnstile_service_unavailable",
          "安全验证服务暂时不可用，请稍后重试。",
        );
      }
    },
  };
}
