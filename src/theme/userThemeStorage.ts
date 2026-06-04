export const legacyUserThemeStorageKey = "uchilog-user-theme";
export const userThemeStorageKeyPrefix = "uchilog-user-theme";
export const userThemeChangeEventName = "uchilog-user-theme-change";

export function getUserThemeStorageKey(storageScope: string) {
  return `${userThemeStorageKeyPrefix}:user:${encodeURIComponent(
    storageScope.trim().toLowerCase(),
  )}`;
}
