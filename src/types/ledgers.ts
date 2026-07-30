import type { CurrentLedgerRole } from "internal/ledger";
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
] as const;

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
  role: LedgerInviteRole;
  token: string | null;
};

export const ledgerInviteRoles = ["admin", "member", "viewer"] as const;

export type LedgerInviteRole = (typeof ledgerInviteRoles)[number];

export function isLedgerInviteRole(value: unknown): value is LedgerInviteRole {
  return ledgerInviteRoles.some((role) => role === value);
}

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

export type LedgerInviteActionOperation = "create" | "revoke";

export type LedgerInviteActionState = BaseActionState & {
  errorKey?: string;
  operation?: LedgerInviteActionOperation;
};

export type LedgerInviteStateAction = (
  previousState: LedgerInviteActionState,
  formData: FormData,
) => Promise<LedgerInviteActionState>;

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
  };
  members: LedgerSettingsMember[];
  pendingInvites: PendingLedgerInvite[];
};
