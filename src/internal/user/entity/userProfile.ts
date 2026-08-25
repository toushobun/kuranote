export const userStatuses = ["active", "disabled"] as const;

export const transactionColorSchemes = [
  "expense_red_income_green",
  "expense_green_income_red",
] as const;

export const defaultTransactionColorScheme =
  "expense_green_income_red" satisfies TransactionColorScheme;

export type UserStatus = (typeof userStatuses)[number];
export type TransactionColorScheme = (typeof transactionColorSchemes)[number];

export function isTransactionColorScheme(
  value: unknown,
): value is TransactionColorScheme {
  return transactionColorSchemes.some((scheme) => scheme === value);
}

export function resolveTransactionColorScheme(value: unknown): {
  isFallback: boolean;
  value: TransactionColorScheme;
} {
  return isTransactionColorScheme(value)
    ? { isFallback: false, value }
    : { isFallback: true, value: defaultTransactionColorScheme };
}

export type UserProfile = {
  avatarUrl: string | null;
  displayName: string;
  email: string | null;
  id: string;
  status: UserStatus;
  transactionColorScheme: TransactionColorScheme;
};
