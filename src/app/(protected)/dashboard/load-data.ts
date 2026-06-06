"use server";

import { getCurrentLedgerOrRedirect } from "lib/ledger/current-ledger";
import { createClient } from "lib/supabase/server";

import type { DashboardViewData } from "./summary-types";

type AccountRow = {
  current_balance: number | string;
};

type TransactionRecordRow = {
  id: string;
  type: "expense" | "income";
  transaction_at: string;
  created_at: string;
};

type TransactionItemRow = {
  transaction_record_id: string;
  amount: number | string;
};

function getCurrentMonthBounds() {
  const current = new Date();
  const year = current.getUTCFullYear();
  const monthIndex = current.getUTCMonth();
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));

  return {
    endIso: end.toISOString(),
    monthLabel: `${year}年${monthIndex + 1}月`,
    startIso: start.toISOString(),
  };
}

function addAmount(
  summary: DashboardViewData["monthSummary"],
  type: "expense" | "income",
  amount: number | string,
) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return;
  }

  if (type === "income") {
    summary.income = String(Number(summary.income) + value);
    summary.balance = String(Number(summary.balance) + value);
    return;
  }

  summary.expense = String(Number(summary.expense) + value);
  summary.balance = String(Number(summary.balance) - value);
}

export async function loadDashboardView(): Promise<DashboardViewData> {
  const currentLedger = await getCurrentLedgerOrRedirect();
  const supabase = await createClient();
  const { startIso, endIso, monthLabel } = getCurrentMonthBounds();

  const { data: accountData, error: accountError } = await supabase
    .from("account")
    .select("current_balance")
    .eq("ledger_id", currentLedger.id)
    .eq("is_archived", false);

  if (accountError) {
    throw new Error("Failed to load dashboard accounts");
  }

  const accounts = (accountData ?? []) as AccountRow[];
  const totalBalance = accounts.reduce(
    (total, account) => total + Number(account.current_balance),
    0,
  );

  const { data: recordData, error: recordError } = await supabase
    .from("transaction_record")
    .select("id, type, transaction_at, created_at")
    .eq("ledger_id", currentLedger.id)
    .eq("status", "active")
    .in("type", ["expense", "income"])
    .gte("transaction_at", startIso)
    .lt("transaction_at", endIso)
    .order("transaction_at", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (recordError) {
    throw new Error("Failed to load dashboard records");
  }

  const records = (recordData ?? []) as TransactionRecordRow[];
  const recordIds = records.map((record) => record.id);
  const itemRequest =
    recordIds.length > 0
      ? supabase
          .from("transaction_item")
          .select("transaction_record_id, amount")
          .eq("ledger_id", currentLedger.id)
          .in("transaction_record_id", recordIds)
      : Promise.resolve({ data: [], error: null });
  const { data: itemData, error: itemError } = await itemRequest;

  if (itemError) {
    throw new Error("Failed to load dashboard items");
  }

  const items = (itemData ?? []) as TransactionItemRow[];
  const itemByRecordId = new Map(
    items.map((item) => [item.transaction_record_id, item] as const),
  );
  const monthSummary = {
    balance: "0",
    currency: currentLedger.baseCurrency,
    expense: "0",
    income: "0",
  };

  for (const record of records) {
    const item = itemByRecordId.get(record.id);

    if (item) {
      addAmount(monthSummary, record.type, item.amount);
    }
  }

  return {
    accountSummary: {
      accountCount: accounts.length,
      currency: currentLedger.baseCurrency,
      totalBalance: String(totalBalance),
    },
    ledgerName: currentLedger.name,
    monthLabel,
    monthSummary,
    recentTransactions: records.slice(0, 5).map((record) => ({
      account_currency: currentLedger.baseCurrency,
      account_name: "账户",
      amount: String(itemByRecordId.get(record.id)?.amount ?? "0"),
      category_name: null,
      id: record.id,
      merchant_icon_url: null,
      merchant_name: null,
      transaction_at: record.transaction_at,
      type: record.type,
    })),
  };
}
