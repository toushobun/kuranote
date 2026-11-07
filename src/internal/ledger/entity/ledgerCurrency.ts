export const ledgerCurrencies = [
  "CNY",
  "JPY",
  "USD",
  "EUR",
  "GBP",
  "KRW",
  "THB",
] as const;

export type LedgerCurrency = (typeof ledgerCurrencies)[number];

/** 统一的币种类型守卫，表单与 Repository 共用。 */
export function isLedgerCurrency(value: string): value is LedgerCurrency {
  return (ledgerCurrencies as readonly string[]).includes(value);
}
