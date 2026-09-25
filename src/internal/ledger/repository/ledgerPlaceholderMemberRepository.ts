import type { LedgerPlaceholderMemberSummary } from "internal/ledger/entity/ledgerPlaceholderMember";
import {
  getLedgerPlaceholderMemberErrorMessage,
  ledgerPlaceholderMemberErrorCodes,
  type LedgerPlaceholderMemberErrorCode,
} from "internal/ledger/errors/ledgerPlaceholderMember";
import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import {
  findRpcBusinessError,
  type RpcErrorLike,
} from "internal/shared/supabase/rpcError";

export type LedgerPlaceholderMemberWriteResult =
  | { ok: true }
  | { code: LedgerPlaceholderMemberErrorCode; ok: false };

export type CreateLedgerPlaceholderMemberResult =
  | { ok: true; placeholderId: string }
  | { code: LedgerPlaceholderMemberErrorCode; ok: false };

/** 批量确保的一行结果：规范化后的名字与被创建或复用的占位 ID。 */
export type EnsuredLedgerPlaceholderMember = {
  displayName: string;
  placeholderId: string;
};

export type EnsureLedgerPlaceholderMembersResult =
  | { ok: true; placeholders: EnsuredLedgerPlaceholderMember[] }
  | { code: LedgerPlaceholderMemberErrorCode; ok: false };

export interface LedgerPlaceholderMemberRepository {
  create(
    ledgerId: string,
    displayName: string,
  ): Promise<CreateLedgerPlaceholderMemberResult>;
  delete(
    ledgerId: string,
    placeholderId: string,
  ): Promise<LedgerPlaceholderMemberWriteResult>;
  /**
   * 在单一事务内按名字批量创建或复用未认领占位（导入映射用）；任一名字失败时
   * 整批回滚，返回业务错误码。
   */
  ensure(
    ledgerId: string,
    displayNames: string[],
  ): Promise<EnsureLedgerPlaceholderMembersResult>;
  /** 只读取未认领占位；权限由 RLS（同账本 active 成员）兜底。 */
  listUnclaimed(ledgerId: string): Promise<LedgerPlaceholderMemberSummary[]>;
  rename(
    ledgerId: string,
    placeholderId: string,
    displayName: string,
  ): Promise<LedgerPlaceholderMemberWriteResult>;
}

/** 只按 RPC `details` 精确匹配，不解析英文 message。 */
const placeholderErrorMap = {
  auth_required: ledgerPlaceholderMemberErrorCodes.authRequired,
  permission_denied: ledgerPlaceholderMemberErrorCodes.permissionDenied,
  placeholder_already_claimed:
    ledgerPlaceholderMemberErrorCodes.placeholderAlreadyClaimed,
  placeholder_in_use: ledgerPlaceholderMemberErrorCodes.placeholderInUse,
  placeholder_name_conflict:
    ledgerPlaceholderMemberErrorCodes.placeholderNameConflict,
  placeholder_name_member_conflict:
    ledgerPlaceholderMemberErrorCodes.placeholderNameMemberConflict,
  placeholder_name_invalid:
    ledgerPlaceholderMemberErrorCodes.placeholderNameInvalid,
  placeholder_not_found: ledgerPlaceholderMemberErrorCodes.placeholderNotFound,
} as const satisfies Readonly<Record<string, LedgerPlaceholderMemberErrorCode>>;

const failureCodes = {
  create: ledgerPlaceholderMemberErrorCodes.createFailed,
  delete: ledgerPlaceholderMemberErrorCodes.deleteFailed,
  ensure: ledgerPlaceholderMemberErrorCodes.createFailed,
  list: ledgerPlaceholderMemberErrorCodes.loadFailed,
  rename: ledgerPlaceholderMemberErrorCodes.renameFailed,
} as const;

function failure(operation: keyof typeof failureCodes, code?: string) {
  const errorCode = failureCodes[operation];
  return toRepositoryError(
    code ?? errorCode,
    getLedgerPlaceholderMemberErrorMessage(errorCode)!,
  );
}

function toSummary(row: unknown): LedgerPlaceholderMemberSummary | null {
  if (typeof row !== "object" || row === null) return null;
  const { display_name, id } = row as Record<string, unknown>;
  if (typeof id !== "string" || typeof display_name !== "string") return null;
  if (display_name.trim() === "") return null;
  return { displayName: display_name, id };
}

function toEnsuredPlaceholder(
  row: unknown,
): EnsuredLedgerPlaceholderMember | null {
  if (typeof row !== "object" || row === null) return null;
  const { display_name, placeholder_id } = row as Record<string, unknown>;
  if (typeof display_name !== "string" || typeof placeholder_id !== "string") {
    return null;
  }
  if (display_name.trim() === "" || placeholder_id === "") return null;
  return { displayName: display_name, placeholderId: placeholder_id };
}

export function createSupabaseLedgerPlaceholderMemberRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): LedgerPlaceholderMemberRepository {
  function logUnexpected(operation: string, error: RpcErrorLike) {
    logger.error(`[ledger] ${operation} failed`, {
      code: error.code ?? null,
      hint: error.hint ?? null,
      message: error.message ?? null,
    });
  }

  async function write(
    operation: "delete" | "rename",
    rpcName: string,
    params: Record<string, string>,
  ): Promise<LedgerPlaceholderMemberWriteResult> {
    const { error } = await supabase.rpc(rpcName, params);
    if (!error) return { ok: true };

    const code = findRpcBusinessError(error, placeholderErrorMap);
    if (code) return { code, ok: false };

    logUnexpected(rpcName, error);
    throw failure(operation);
  }

  return {
    async create(ledgerId, displayName) {
      const { data, error } = await supabase.rpc(
        "create_ledger_placeholder_member",
        { p_display_name: displayName, p_ledger_id: ledgerId },
      );

      if (error) {
        const code = findRpcBusinessError(error, placeholderErrorMap);
        if (code) return { code, ok: false };
        logUnexpected("create_ledger_placeholder_member", error);
        throw failure("create");
      }

      if (typeof data !== "string") {
        logger.error(
          "[ledger] create_ledger_placeholder_member returned invalid data",
          { type: typeof data },
        );
        throw failure("create", "ledger_placeholder_create_result_invalid");
      }

      return { ok: true, placeholderId: data };
    },

    delete(ledgerId, placeholderId) {
      return write("delete", "delete_ledger_placeholder_member", {
        p_ledger_id: ledgerId,
        p_placeholder_id: placeholderId,
      });
    },

    async ensure(ledgerId, displayNames) {
      const { data, error } = await supabase.rpc(
        "ensure_ledger_placeholder_members",
        { p_display_names: displayNames, p_ledger_id: ledgerId },
      );

      if (error) {
        const code = findRpcBusinessError(error, placeholderErrorMap);
        if (code) return { code, ok: false };
        logUnexpected("ensure_ledger_placeholder_members", error);
        throw failure("ensure");
      }

      const rows: unknown[] = Array.isArray(data) ? data : [];
      const placeholders = rows.flatMap((row) => {
        const placeholder = toEnsuredPlaceholder(row);
        return placeholder ? [placeholder] : [];
      });
      if (!Array.isArray(data) || placeholders.length !== rows.length) {
        // 行格式异常时整体失败，避免把缺失的映射静默当成「无持有人」继续导入。
        logger.error(
          "[ledger] ensure_ledger_placeholder_members returned invalid data",
          { rowCount: rows.length },
        );
        throw failure("ensure", "ledger_placeholder_ensure_result_invalid");
      }

      return { ok: true, placeholders };
    },

    async listUnclaimed(ledgerId) {
      const { data, error } = await supabase
        .from("ledger_placeholder_member")
        .select("id, display_name")
        .eq("ledger_id", ledgerId)
        .is("claimed_by", null)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true });

      if (error) {
        logUnexpected("list ledger_placeholder_member", error);
        throw failure("list");
      }
      if (!Array.isArray(data)) {
        throw failure("list", "ledger_placeholder_list_result_invalid");
      }

      const summaries: LedgerPlaceholderMemberSummary[] = [];
      for (const row of data) {
        const summary = toSummary(row);
        if (!summary) {
          // 行格式异常时整体失败，避免把缺失的占位静默显示成「无持有人」。
          logger.error("[ledger] ledger_placeholder_member row invalid", {
            rowCount: data.length,
          });
          throw failure("list", "ledger_placeholder_list_result_invalid");
        }
        summaries.push(summary);
      }
      return summaries;
    },

    rename(ledgerId, placeholderId, displayName) {
      return write("rename", "rename_ledger_placeholder_member", {
        p_display_name: displayName,
        p_ledger_id: ledgerId,
        p_placeholder_id: placeholderId,
      });
    },
  };
}
