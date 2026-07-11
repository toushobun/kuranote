import type { ThemeColorKey } from "theme/themeColorTokens";

import {
  buildSingleHolderAccountColorById,
  type AccountHolderDisplayColorRow,
  type LedgerMemberDisplayColorRow,
} from "./accountHolderDisplayColors";

type ActiveLedgerMemberRow = {
  user_id: string;
};

type QueryResult<TRow> = {
  data: TRow[] | null;
  error: unknown | null;
};

type FilterBuilder<TRow> = PromiseLike<QueryResult<TRow>> & {
  eq(column: string, value: string): FilterBuilder<TRow>;
  in(column: string, values: string[]): FilterBuilder<TRow>;
};

type QueryBuilder<TRow> = {
  select(columns: string): FilterBuilder<TRow>;
};

export type TransactionMemberColorContextSupabaseClient = {
  from(table: string): unknown;
};

export type TransactionMemberColorContext = {
  accountColorById: Map<string, ThemeColorKey>;
  showRecorder: boolean;
};

function fromTable<TRow>(
  supabase: TransactionMemberColorContextSupabaseClient,
  table: string,
) {
  return supabase.from(table) as QueryBuilder<TRow>;
}

export function buildTransactionMemberColorContext({
  activeMembers,
  holders,
  settings,
}: {
  activeMembers: ActiveLedgerMemberRow[];
  holders: AccountHolderDisplayColorRow[];
  settings: LedgerMemberDisplayColorRow[];
}): TransactionMemberColorContext {
  const activeMemberUserIds = new Set(
    activeMembers.map((member) => member.user_id),
  );

  return {
    accountColorById: buildSingleHolderAccountColorById({
      activeMemberUserIds,
      holders,
      settings,
    }),
    showRecorder: activeMemberUserIds.size > 1,
  };
}

export async function loadTransactionMemberColorContext({
  accountIds,
  ledgerId,
  supabase,
}: {
  accountIds: string[];
  ledgerId: string;
  supabase: TransactionMemberColorContextSupabaseClient;
}): Promise<TransactionMemberColorContext> {
  const uniqueAccountIds = [...new Set(accountIds)];
  const accountHolderQuery =
    uniqueAccountIds.length > 0
      ? fromTable<AccountHolderDisplayColorRow>(supabase, "account_holder")
          .select("account_id, user_id")
          .eq("ledger_id", ledgerId)
          .in("account_id", uniqueAccountIds)
      : Promise.resolve({ data: [], error: null });
  const memberDisplaySettingQuery =
    uniqueAccountIds.length > 0
      ? fromTable<LedgerMemberDisplayColorRow>(
          supabase,
          "ledger_member_display_setting",
        )
          .select("user_id, display_color")
          .eq("ledger_id", ledgerId)
      : Promise.resolve({ data: [], error: null });
  const activeMemberQuery = fromTable<ActiveLedgerMemberRow>(
    supabase,
    "ledger_member",
  )
    .select("user_id")
    .eq("ledger_id", ledgerId)
    .eq("status", "active");
  const [accountHolderResult, memberDisplaySettingResult, activeMemberResult] =
    await Promise.all([
      accountHolderQuery,
      memberDisplaySettingQuery,
      activeMemberQuery,
    ]);

  if (accountHolderResult.error) {
    throw new Error("Failed to load transaction account holders");
  }
  if (memberDisplaySettingResult.error) {
    throw new Error("Failed to load transaction account holder colors");
  }
  if (activeMemberResult.error) {
    throw new Error("Failed to load active transaction ledger members");
  }

  return buildTransactionMemberColorContext({
    activeMembers: activeMemberResult.data ?? [],
    holders: accountHolderResult.data ?? [],
    settings: memberDisplaySettingResult.data ?? [],
  });
}
