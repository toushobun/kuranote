import type {
  AppUserSummaryDbRow,
  LedgerMemberDisplaySettingDbRow,
} from "server/db-types";
import { isThemeColorKey } from "theme/themeColorTokens";

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
  in(
    column: string,
    values: string[],
  ): LedgerMemberDisplayNameFilterBuilder<TRow>;
};

type LedgerMemberDisplayNameQueryBuilder<TRow> = {
  select(columns: string): LedgerMemberDisplayNameFilterBuilder<TRow>;
};

export type LedgerMemberDisplayNameSupabaseClient = {
  from(table: string): unknown;
};

function normalizeLedgerMemberDisplayName(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function normalizeLedgerMemberDisplayColor(value: string | null | undefined) {
  return value && isThemeColorKey(value) ? value : null;
}

function fromTable<TRow>(
  supabase: LedgerMemberDisplayNameSupabaseClient,
  table: string,
) {
  return supabase.from(table) as LedgerMemberDisplayNameQueryBuilder<TRow>;
}

function buildLedgerMemberDisplaySettingByUserId(
  memberDisplaySettings: LedgerMemberDisplaySettingDbRow[],
) {
  return new Map(
    memberDisplaySettings.map((setting) => [setting.user_id, setting] as const),
  );
}

export function mergeLedgerMemberDisplayNames<
  TUser extends LedgerMemberDisplayNameUser,
>(
  appUsers: TUser[],
  memberDisplaySettings: LedgerMemberDisplaySettingDbRow[],
  { includeDisplayColor = false }: { includeDisplayColor?: boolean } = {},
): TUser[] {
  const settingByUserId = buildLedgerMemberDisplaySettingByUserId(
    memberDisplaySettings,
  );

  return appUsers.map((user) => {
    const setting = settingByUserId.get(user.id);
    const displayName =
      normalizeLedgerMemberDisplayName(setting?.display_name) ??
      user.display_name;

    if (!includeDisplayColor) {
      return {
        ...user,
        display_name: displayName,
      };
    }

    return {
      ...user,
      display_color: normalizeLedgerMemberDisplayColor(setting?.display_color),
      display_name: displayName,
    };
  });
}

export async function loadUsersWithLedgerDisplayNames<
  TUser extends LedgerMemberDisplayNameUser = AppUserSummaryDbRow,
>({
  includeDisplayColor = false,
  ledgerId,
  memberDisplayErrorMessage = "Failed to load ledger member display names",
  memberDisplaySettings,
  select = "id, display_name",
  supabase,
  userErrorMessage = "Failed to load users",
  userIds,
}: {
  includeDisplayColor?: boolean;
  ledgerId: string;
  memberDisplayErrorMessage?: string;
  memberDisplaySettings?: LedgerMemberDisplaySettingDbRow[];
  select?: string;
  supabase: LedgerMemberDisplayNameSupabaseClient;
  userErrorMessage?: string;
  userIds: string[];
}): Promise<TUser[]> {
  if (userIds.length === 0) return [];

  const userQuery = fromTable<TUser>(supabase, "app_user")
    .select(select)
    .in("id", userIds);
  const memberDisplayQuery = memberDisplaySettings
    ? Promise.resolve({ data: memberDisplaySettings, error: null })
    : fromTable<LedgerMemberDisplaySettingDbRow>(
        supabase,
        "ledger_member_display_setting",
      )
        .select(
          includeDisplayColor
            ? "user_id, display_name, display_color"
            : "user_id, display_name",
        )
        .eq("ledger_id", ledgerId)
        .in("user_id", userIds);
  const [userResult, memberDisplayResult] = await Promise.all([
    userQuery,
    memberDisplayQuery,
  ]);

  if (userResult.error) throw new Error(userErrorMessage);
  if (memberDisplayResult.error) throw new Error(memberDisplayErrorMessage);

  return mergeLedgerMemberDisplayNames(
    userResult.data ?? [],
    memberDisplayResult.data ?? [],
    { includeDisplayColor },
  );
}
