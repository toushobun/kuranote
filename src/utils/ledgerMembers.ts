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
 * 成员列表的三种来源之二：占位与待接受邀请。绑定邀请只按 placeholderId
 * 合并进对应占位行，不看显示名；匿名邀请保持独立。占位不存在于当前列表的
 * 绑定邀请（例如读取竞态）仍按待接受邀请显示，避免管理员无法撤销。
 */
export function groupLedgerPendingPeople({
  pendingInvites,
  placeholders,
}: {
  pendingInvites: PendingLedgerInvite[];
  placeholders: LedgerPlaceholderMemberSummary[];
}): {
  anonymousInvites: PendingLedgerInvite[];
  placeholderRows: LedgerPlaceholderMemberRowView[];
} {
  const placeholderIds = new Set(placeholders.map(({ id }) => id));
  const inviteByPlaceholderId = new Map<string, PendingLedgerInvite>();
  const anonymousInvites: PendingLedgerInvite[] = [];

  for (const invite of pendingInvites) {
    if (
      invite.placeholderId !== null &&
      placeholderIds.has(invite.placeholderId) &&
      !inviteByPlaceholderId.has(invite.placeholderId)
    ) {
      inviteByPlaceholderId.set(invite.placeholderId, invite);
    } else {
      anonymousInvites.push(invite);
    }
  }

  return {
    anonymousInvites,
    placeholderRows: placeholders.map((placeholder) => ({
      invite: inviteByPlaceholderId.get(placeholder.id) ?? null,
      placeholder,
    })),
  };
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
