export const userStatuses = ["active", "disabled"] as const;

export const transactionColorSchemes = [
  "expense_red_income_green",
  "expense_green_income_red",
] as const;

/** 用户主题 key 的唯一权威定义；数据库 app_user.theme_key 的 check 约束与此保持一致。 */
export const userThemeKeys = [
  "amberWarmth",
  "lavenderDream",
  "emeraldMorning",
  "sakuraStory",
  "deepSeaStarlight",
  "flameRed",
] as const;

export const defaultUserThemeKey = "amberWarmth" satisfies UserThemeKey;

export const defaultTransactionColorScheme =
  "expense_green_income_red" satisfies TransactionColorScheme;

export type UserStatus = (typeof userStatuses)[number];
export type TransactionColorScheme = (typeof transactionColorSchemes)[number];
export type UserThemeKey = (typeof userThemeKeys)[number];

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

export function isUserThemeKey(value: unknown): value is UserThemeKey {
  return userThemeKeys.some((key) => key === value);
}

export function resolveUserThemeKey(value: unknown): {
  isFallback: boolean;
  value: UserThemeKey;
} {
  return isUserThemeKey(value)
    ? { isFallback: false, value }
    : { isFallback: true, value: defaultUserThemeKey };
}

export type UserProfile = {
  avatarUrl: string | null;
  displayName: string;
  email: string | null;
  id: string;
  status: UserStatus;
  themeKey: UserThemeKey;
  transactionColorScheme: TransactionColorScheme;
};
