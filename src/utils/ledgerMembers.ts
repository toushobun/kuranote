import { transactionTimeLocale } from "config/dateTime";
import type {
  LedgerPlaceholderMemberSummary,
  PendingLedgerInvite,
} from "types/ledgers";

export type LedgerPlaceholderMemberRowView = {
  /** 该占位当前唯一的有效绑定邀请；没有时为 null。 */
  invite: PendingLedgerInvite | null;
  placeholder: LedgerPlaceholderMemberSummary;
};

/**
 * 成员列表中的待邀请成员行：每个未认领占位一行，其有效绑定邀请按 placeholderId
 * 合并进来，不看显示名。#809 起不再有匿名邀请；找不到对应占位的邀请只会在
 * 读取竞态时出现，直接不显示，刷新后即与数据库一致。
 */
export function buildLedgerPlaceholderRows({
  pendingInvites,
  placeholders,
}: {
  pendingInvites: PendingLedgerInvite[];
  placeholders: LedgerPlaceholderMemberSummary[];
}): LedgerPlaceholderMemberRowView[] {
  const inviteByPlaceholderId = new Map<string, PendingLedgerInvite>();

  for (const invite of pendingInvites) {
    if (
      invite.placeholderId !== null &&
      !inviteByPlaceholderId.has(invite.placeholderId)
    ) {
      inviteByPlaceholderId.set(invite.placeholderId, invite);
    }
  }

  return placeholders.map((placeholder) => ({
    invite: inviteByPlaceholderId.get(placeholder.id) ?? null,
    placeholder,
  }));
}

export function formatInviteCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "已创建";

  return new Intl.DateTimeFormat(transactionTimeLocale, {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "numeric",
  }).format(date);
}
