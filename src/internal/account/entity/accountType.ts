export const accountTypes = [
  "cash",
  "bank",
  "credit_card",
  "e_money",
  "other",
] as const;

export type AccountType = (typeof accountTypes)[number];
