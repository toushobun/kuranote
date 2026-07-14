import type { CurrentLedgerRole } from "lib/ledger/current-ledger";
import type { ThemeColorKey } from "theme/themeColorTokens";

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
  role: "member" | "viewer";
};

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
