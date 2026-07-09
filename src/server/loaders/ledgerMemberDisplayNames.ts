import type {
  AppUserSummaryDbRow,
  LedgerMemberDisplaySettingDbRow,
} from "server/db-types";

function normalizeLedgerMemberDisplayName(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

export function mergeLedgerMemberDisplayNames(
  appUsers: AppUserSummaryDbRow[],
  memberDisplaySettings: LedgerMemberDisplaySettingDbRow[],
): AppUserSummaryDbRow[] {
  const displayNameByUserId = new Map<string, string>();

  for (const setting of memberDisplaySettings) {
    const displayName = normalizeLedgerMemberDisplayName(setting.display_name);
    if (displayName) displayNameByUserId.set(setting.user_id, displayName);
  }

  return appUsers.map((user) => ({
    ...user,
    display_name: displayNameByUserId.get(user.id) ?? user.display_name,
  }));
}
