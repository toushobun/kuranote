import { createClient } from "lib/supabase/server";
import { isLedgerInviteRole, type LedgerInviteRole } from "types/ledgers";

export type LedgerInviteStatus =
  | "valid"
  | "already_member"
  | "accepted"
  | "revoked"
  | "invalid";

export type LedgerInvitePreview = {
  inviteRole: LedgerInviteRole | null;
  inviterName: string | null;
  ledgerName: string | null;
  status: LedgerInviteStatus;
};

const invalidInvitePreview: LedgerInvitePreview = {
  inviteRole: null,
  inviterName: null,
  ledgerName: null,
  status: "invalid",
};

// 邀请创建 / 撤销 / 列表 / 接受已迁移至 server/ledger/repository、
// server/ledger/service（见 #472 / #468）。这里只保留未登录也可访问的
// 邀请预览查询，不属于 ledger 模块的 Container 依赖注入范围。
export async function loadLedgerInvitePreview(
  token: string,
): Promise<LedgerInvitePreview> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_ledger_invite_preview", {
      p_token: token,
    });
    const row = Array.isArray(data) ? data[0] : null;

    if (error || !row) {
      return invalidInvitePreview;
    }

    return {
      inviteRole: isLedgerInviteRole(row.invite_role) ? row.invite_role : null,
      inviterName:
        typeof row.inviter_name === "string" ? row.inviter_name : null,
      ledgerName: typeof row.ledger_name === "string" ? row.ledger_name : null,
      status: isInviteStatus(row.invite_status) ? row.invite_status : "invalid",
    };
  } catch {
    console.error("[ledgerInvite] failed to load invite preview");
    return invalidInvitePreview;
  }
}

function isInviteStatus(value: unknown): value is LedgerInviteStatus {
  return (
    value === "valid" ||
    value === "already_member" ||
    value === "accepted" ||
    value === "revoked" ||
    value === "invalid"
  );
}
