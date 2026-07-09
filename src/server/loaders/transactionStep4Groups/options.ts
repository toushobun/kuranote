import { getCurrentLedgerOrRedirect } from "lib/ledger/current-ledger";
import { createClient } from "lib/supabase/server";
import type {
  AccountOptionDbRow,
  CategorySummaryDbRow,
  MerchantSummaryDbRow,
  TransactionTagDbRow,
} from "server/db-types";
import {
  loadUsersWithLedgerDisplayNames,
  type LedgerMemberDisplayNameSupabaseClient,
} from "server/loaders/ledgerMemberDisplayNames";
import type {
  TransactionFilterOptions,
  TransactionMemberOption,
} from "types/transactions";

export async function loadTransactionFilterOptions(): Promise<TransactionFilterOptions> {
  const currentLedger = await getCurrentLedgerOrRedirect();
  const supabase = await createClient();

  const [
    accountResult,
    categoryResult,
    merchantResult,
    tagResult,
    memberResult,
  ] = await Promise.all([
    supabase
      .from("account")
      .select("id, name, currency")
      .eq("ledger_id", currentLedger.id)
      .eq("is_archived", false)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("category")
      .select("id, name, type, parent_id")
      .eq("ledger_id", currentLedger.id)
      .eq("is_archived", false)
      .order("type", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("merchant")
      .select("id, name, icon_url")
      .eq("ledger_id", currentLedger.id)
      .eq("is_archived", false)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("transaction_tag")
      .select("id, name, color")
      .eq("ledger_id", currentLedger.id)
      .eq("is_archived", false)
      .order("name", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("ledger_member")
      .select("user_id")
      .eq("ledger_id", currentLedger.id)
      .eq("status", "active"),
  ]);

  if (accountResult.error) throw new Error("Failed to load account options");
  if (categoryResult.error) throw new Error("Failed to load category options");
  if (merchantResult.error) throw new Error("Failed to load merchant options");
  if (tagResult.error) throw new Error("Failed to load tag options");
  if (memberResult.error) throw new Error("Failed to load member options");

  const memberRows = (memberResult.data ?? []) as { user_id: string }[];
  const memberUserIds = [...new Set(memberRows.map((row) => row.user_id))];
  const members = await loadMemberOptions(
    supabase,
    currentLedger.id,
    memberUserIds,
  );

  return {
    accounts: (accountResult.data ?? []) as AccountOptionDbRow[],
    categories: buildFilterCategoryOptions(
      (categoryResult.data ?? []) as CategorySummaryDbRow[],
    ),
    members,
    merchants: (merchantResult.data ?? []) as MerchantSummaryDbRow[],
    tags: (tagResult.data ?? []) as TransactionTagDbRow[],
  };
}

async function loadMemberOptions(
  supabase: LedgerMemberDisplayNameSupabaseClient,
  ledgerId: string,
  memberUserIds: string[],
): Promise<TransactionMemberOption[]> {
  return (
    await loadUsersWithLedgerDisplayNames({
      ledgerId,
      memberDisplayErrorMessage: "Failed to load member display name options",
      supabase,
      userErrorMessage: "Failed to load member user options",
      userIds: memberUserIds,
    })
  )
    .map((member) => ({
      id: member.id,
      name: member.display_name,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function buildFilterCategoryOptions(rows: CategorySummaryDbRow[]) {
  const parentNameById = new Map(
    rows
      .filter((row) => row.parent_id === null)
      .map((row) => [row.id, row.name]),
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    parentName: row.parent_id
      ? (parentNameById.get(row.parent_id) ?? null)
      : null,
    type: row.type,
  }));
}
