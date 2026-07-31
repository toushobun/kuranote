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
