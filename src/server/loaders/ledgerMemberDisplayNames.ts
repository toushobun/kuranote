import type {
  AppUserSummaryDbRow,
  LedgerMemberDisplaySettingDbRow,
} from "server/db-types";

type LedgerMemberDisplayNameUser = {
  display_name: string;
  id: string;
};

type LedgerMemberDisplayNameQueryResult<TRow> = {
  data: TRow[] | null;
  error: unknown | null;
};

type LedgerMemberDisplayNameFilterBuilder<TRow> = PromiseLike<
  LedgerMemberDisplayNameQueryResult<TRow>
> & {
  eq(column: string, value: string): LedgerMemberDisplayNameFilterBuilder<TRow>;
  in(column: string, values: string[]): LedgerMemberDisplayNameFilterBuilder<TRow>;
};

type LedgerMemberDisplayNameQueryBuilder<TRow> = {
  select(columns: string): LedgerMemberDisplayNameFilterBuilder<TRow>;
};

export type LedgerMemberDisplayNameSupabaseClient = {
  from(table: string): LedgerMemberDisplayNameQueryBuilder<unknown>;
};

function normalizeLedgerMemberDisplayName(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

export function buildLedgerMemberDisplayNameByUserId(
  memberDisplaySettings: LedgerMemberDisplaySettingDbRow[],
) {
  const displayNameByUserId = new Map<string, string>();

  for (const setting of memberDisplaySettings) {
    const displayName = normalizeLedgerMemberDisplayName(setting.display_name);
    if (displayName) displayNameByUserId.set(setting.user_id, displayName);
  }

  return displayNameByUserId;
}

export function mergeLedgerMemberDisplayNames<
  TUser extends LedgerMemberDisplayNameUser,
>(
  appUsers: TUser[],
  memberDisplaySettings: LedgerMemberDisplaySettingDbRow[],
): TUser[] {
  const displayNameByUserId = buildLedgerMemberDisplayNameByUserId(
    memberDisplaySettings,
  );

  return appUsers.map((user) => ({
    ...user,
    display_name: displayNameByUserId.get(user.id) ?? user.display_name,
  }));
}

export async function loadUsersWithLedgerDisplayNames<
  TUser extends LedgerMemberDisplayNameUser = AppUserSummaryDbRow,
>({
  ledgerId,
  memberDisplayErrorMessage = "Failed to load ledger member display names",
  memberDisplaySettings,
  select = "id, display_name",
  supabase,
  userErrorMessage = "Failed to load users",
  userIds,
}: {
  ledgerId: string;
  memberDisplayErrorMessage?: string;
  memberDisplaySettings?: LedgerMemberDisplaySettingDbRow[];
  select?: string;
  supabase: LedgerMemberDisplayNameSupabaseClient;
  userErrorMessage?: string;
  userIds: string[];
}): Promise<TUser[]> {
  if (userIds.length === 0) return [];

  const userQuery = supabase
    .from("app_user")
    .select(select)
    .in("id", userIds) as PromiseLike<
    LedgerMemberDisplayNameQueryResult<TUser>
  >;
  const memberDisplayQuery = memberDisplaySettings
    ? Promise.resolve({ data: memberDisplaySettings, error: null })
    : (supabase
        .from("ledger_member_display_setting")
        .select("user_id, display_name")
        .eq("ledger_id", ledgerId)
        .in("user_id", userIds) as PromiseLike<
        LedgerMemberDisplayNameQueryResult<LedgerMemberDisplaySettingDbRow>
      >);
  const [userResult, memberDisplayResult] = await Promise.all([
    userQuery,
    memberDisplayQuery,
  ]);

  if (userResult.error) throw new Error(userErrorMessage);
  if (memberDisplayResult.error) throw new Error(memberDisplayErrorMessage);

  return mergeLedgerMemberDisplayNames(
    userResult.data ?? [],
    memberDisplayResult.data ?? [],
  );
}
