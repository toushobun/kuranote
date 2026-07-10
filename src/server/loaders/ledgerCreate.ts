import { routePaths } from "config/paths";
import { getCurrentLedgerContext } from "lib/ledger/current-ledger";
import { createClient } from "lib/supabase/server";
import type { ThemeColorKey } from "theme/themeColorTokens";
import { ledgerCurrencyOptions } from "types/ledgers";

export type LedgerCreateView = {
  backHref: string;
  defaults: {
    baseCurrency: string;
    displayColor: ThemeColorKey;
    displayName: string;
    ledgerName: string;
  };
};

export async function loadLedgerCreateView(): Promise<LedgerCreateView> {
  const { currentLedger, email, userId } = await getCurrentLedgerContext();
  const supabase = await createClient();
  const profileQuery = supabase
    .from("app_user")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  const { data: profile, error } = await profileQuery;

  if (error) {
    console.error("Failed to load ledger create profile.", error);
    throw new Error(`Failed to load ledger create profile: ${error.message}`);
  }

  const displayName = profile?.display_name?.trim();
  const emailName = email.split("@")[0]?.trim();
  const inheritedCurrency = currentLedger?.baseCurrency;
  const baseCurrency =
    inheritedCurrency &&
    ledgerCurrencyOptions.some((option) => option.value === inheritedCurrency)
      ? inheritedCurrency
      : "JPY";

  return {
    backHref: currentLedger ? routePaths.ledgers : routePaths.dashboard,
    defaults: {
      baseCurrency,
      displayColor: "amber",
      displayName: displayName || emailName || "未命名用户",
      ledgerName: "家庭账本",
    },
  };
}
