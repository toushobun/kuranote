import type {
  CurrentLedgerRole,
  LedgerPlaceholderMemberSummary,
} from "internal/ledger";
import type { LedgerCurrency } from "internal/ledger";
import {
  isLedgerInviteRole,
  ledgerInviteRoles,
  type LedgerInviteRole,
} from "internal/ledger";
import type { ThemeColorKey } from "theme/themeColorTokens";
import type { BaseActionState } from "types/auth";

export const ledgerCurrencyOptions = [
  { label: "CNY 人民币", value: "CNY" },
  { label: "JPY 日元", value: "JPY" },
  { label: "USD 美元", value: "USD" },
  { label: "EUR 欧元", value: "EUR" },
  { label: "GBP 英镑", value: "GBP" },
  { label: "KRW 韩元", value: "KRW" },
  { label: "THB 泰铢", value: "THB" },
] as const satisfies readonly {
  label: string;
  value: LedgerCurrency;
}[];

export const ledgerMemberColorOptions = [
  "amber",
  "sakura",
  "lime",
  "jade",
  "sky",
  "lavender",
] as const satisfies readonly ThemeColorKey[];

export const ledgerRoleLabels: Record<CurrentLedgerRole, string> = {
  admin: "管理员",
  member: "成员",
  owner: "所有者",
  viewer: "只读",
};

export const ledgerRoleOptions = [
  { label: ledgerRoleLabels.owner, value: "owner" },
  { label: ledgerRoleLabels.admin, value: "admin" },
  { label: ledgerRoleLabels.member, value: "member" },
  { label: ledgerRoleLabels.viewer, value: "viewer" },
] as const satisfies readonly {
  label: string;
  value: CurrentLedgerRole;
}[];

export type LedgerSettingsMember = {
  avatarUrl: string | null;
  displayColor: ThemeColorKey;
  displayName: string;
  email: string | null;
  role: CurrentLedgerRole;
  userId: string;
};

export type PendingLedgerInvite = {
  createdAt: string;
  id: string;
  /**
   * 绑定的待邀请成员 ID，合并展示只以此为准，不看显示名。#809 起新邀请必定绑定；
   * RPC 返回列仍可空，展示时找不到占位的邀请直接忽略。
   */
  placeholderId: string | null;
  role: LedgerInviteRole;
  token: string | null;
};

export type { LedgerPlaceholderMemberSummary };

export { isLedgerInviteRole, ledgerInviteRoles, type LedgerInviteRole };

export const ledgerInviteRoleLabels: Record<LedgerInviteRole, string> = {
  admin: "管理员（Admin）",
  member: "用户（Member）",
  viewer: "只读（Viewer）",
};

export type CurrentLedgerActionState = BaseActionState & {
  errorKey?: string;
};

export type CurrentLedgerStateAction = (
  previousState: CurrentLedgerActionState,
  formData: FormData,
) => Promise<CurrentLedgerActionState>;

export type LedgerCreateActionState = BaseActionState & {
  errorKey?: string;
};

export type LedgerCreateStateAction = (
  previousState: LedgerCreateActionState,
  formData: FormData,
) => Promise<LedgerCreateActionState>;

export type LedgerInviteActionOperation = "create" | "invite" | "revoke";

export type LedgerInviteActionState = BaseActionState & {
  errorKey?: string;
  operation?: LedgerInviteActionOperation;
};

export type LedgerInviteStateAction = (
  previousState: LedgerInviteActionState,
  formData: FormData,
) => Promise<LedgerInviteActionState>;

export type LedgerPlaceholderMemberActionOperation = "delete" | "rename";

export type LedgerPlaceholderMemberActionState = BaseActionState & {
  errorKey?: string;
  operation?: LedgerPlaceholderMemberActionOperation;
  /** 每次成功生成新值，用于区分连续的成功反馈。 */
  successKey?: string;
};

export type LedgerPlaceholderMemberStateAction = (
  previousState: LedgerPlaceholderMemberActionState,
  formData: FormData,
) => Promise<LedgerPlaceholderMemberActionState>;

export type LedgerPlaceholderMemberActions = Record<
  LedgerPlaceholderMemberActionOperation,
  LedgerPlaceholderMemberStateAction
>;

export type LedgerSettingsActionState = BaseActionState & {
  errorKey?: string;
};

export type LedgerSettingsStateAction = (
  previousState: LedgerSettingsActionState,
  formData: FormData,
) => Promise<LedgerSettingsActionState>;

export type LedgerSettingsView = {
  canEditLedger: boolean;
  currentUser: {
    displayColor: ThemeColorKey;
    displayName: string;
    userId: string;
  };
  ledger: {
    baseCurrency: string;
    currentUserRole: CurrentLedgerRole;
    id: string;
    isCurrent: boolean;
    name: string;
    transactionItemSpecialStatusEnabled?: boolean;
  };
  members: LedgerSettingsMember[];
  pendingInvites: PendingLedgerInvite[];
  placeholderMembers: LedgerPlaceholderMemberSummary[];
};
