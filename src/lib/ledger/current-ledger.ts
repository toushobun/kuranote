import type { QueryData } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";

import { routePaths } from "config/paths";
import { createClient } from "lib/supabase/server";

export type CurrentLedgerRole = "owner" | "admin" | "member" | "viewer";

export type CurrentLedger = {
  id: string;
  name: string;
  baseCurrency: string;
  currentUserId?: string;
  currentUserRole: CurrentLedgerRole;
};

export type LedgerWithMemberCount = CurrentLedger & {
  memberCount: number;
};

export type CurrentLedgerContext = {
  userId: string;
  email: string;
  ledgers: CurrentLedger[];
  currentLedger: CurrentLedger | null;
};

const fallbackCurrentLedgerRole: CurrentLedgerRole = "member";

function toCurrentLedgerRole(role: string | null): CurrentLedgerRole {
  if (
    role === "owner" ||
    role === "admin" ||
    role === "member" ||
    role === "viewer"
  ) {
    return role;
  }

  return fallbackCurrentLedgerRole;
}

export const getCurrentLedgerContext = cache(
  async (): Promise<CurrentLedgerContext> => {
    // cache() 的缓存范围是单次 server request。
    // redirect() 抛出的控制流即使在同一请求内被复用，也只会在该请求内重新触发跳转，不会跨请求污染登录状态。
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims) {
      redirect(routePaths.login);
    }

    const userId = data.claims.sub;

    if (typeof userId !== "string" || userId.length === 0) {
      redirect(routePaths.login);
    }

    const email =
      typeof data.claims.email === "string" ? data.claims.email : "登录用户";

    const appUserQuery = supabase
      .from("app_user")
      .select("current_ledger_id")
      .eq("id", userId);
    type AppUserRows = QueryData<typeof appUserQuery>;

    const { data: appUserData, error: appUserError } = await appUserQuery;

    if (appUserError) {
      console.error("Failed to load current app user.", appUserError);
      throw new Error(
        `Failed to load current app user: ${appUserError.message}`,
      );
    }

    const appUserRows: AppUserRows = appUserData ?? [];
    const storedCurrentLedgerId = appUserRows.find(
      (row) => typeof row.current_ledger_id === "string",
    )?.current_ledger_id;

    const memberQuery = supabase
      .from("ledger_member")
      .select("ledger_id, role")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("joined_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .order("ledger_id", { ascending: true });
    type LedgerMemberRows = QueryData<typeof memberQuery>;

    const { data: memberData, error: memberError } = await memberQuery;

    if (memberError) {
      console.error("Failed to load current ledger members.", memberError);
      throw new Error(
        `Failed to load current ledger members: ${memberError.message}`,
      );
    }

    const memberRows: LedgerMemberRows = memberData ?? [];
    const ledgerIds = memberRows
      .map((row) => row.ledger_id)
      .filter(
        (ledgerId): ledgerId is string =>
          typeof ledgerId === "string" && ledgerId.length > 0,
      );

    if (ledgerIds.length === 0) {
      return {
        userId,
        email,
        ledgers: [],
        currentLedger: null,
      };
    }

    const ledgerQuery = supabase
      .from("ledger")
      .select("id, name, base_currency")
      .in("id", ledgerIds)
      .eq("is_archived", false);
    type LedgerRows = QueryData<typeof ledgerQuery>;

    const { data: ledgerData, error: ledgerError } = await ledgerQuery;

    if (ledgerError) {
      console.error("Failed to load current ledgers.", ledgerError);
      throw new Error(`Failed to load current ledgers: ${ledgerError.message}`);
    }

    const roleByLedgerId = new Map<string, CurrentLedgerRole>();

    for (const row of memberRows) {
      if (typeof row.ledger_id !== "string" || row.ledger_id.length === 0) {
        continue;
      }

      roleByLedgerId.set(
        row.ledger_id,
        toCurrentLedgerRole(typeof row.role === "string" ? row.role : null),
      );
    }

    const ledgerRows: LedgerRows = ledgerData ?? [];
    const ledgerById = new Map(
      ledgerRows.map((ledger) => [
        ledger.id,
        {
          id: ledger.id,
          name: ledger.name,
          baseCurrency: ledger.base_currency,
          currentUserId: userId,
          currentUserRole:
            roleByLedgerId.get(ledger.id) ?? fallbackCurrentLedgerRole,
        },
      ]),
    );

    const ledgers: CurrentLedger[] = ledgerIds.flatMap((ledgerId) => {
      const ledger = ledgerById.get(ledgerId);
      return ledger ? [ledger] : [];
    });
    const currentLedger = storedCurrentLedgerId
      ? (ledgers.find((ledger) => ledger.id === storedCurrentLedgerId) ?? null)
      : null;

    return {
      userId,
      email,
      ledgers,
      currentLedger: currentLedger ?? ledgers[0] ?? null,
    };
  },
);

export async function getCurrentLedgerOrRedirect() {
  const context = await getCurrentLedgerContext();

  if (!context.currentLedger) {
    redirect(routePaths.dashboard);
  }

  return context.currentLedger;
}
