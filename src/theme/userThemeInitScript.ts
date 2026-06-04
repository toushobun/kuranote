import { getUserThemeCssVariables } from "./userThemeCssVariables";
import {
  defaultUserThemeKey,
  type UserThemeKey,
  userThemeKeys,
} from "./userThemeTokens";
import {
  getUserThemeStorageKey,
  legacyUserThemeStorageKey,
} from "./userThemeStorage";

const userThemeCssVariablesByKey = Object.fromEntries(
  userThemeKeys.map((themeKey) => [
    themeKey,
    getUserThemeCssVariables(themeKey),
  ]),
) as Record<UserThemeKey, ReturnType<typeof getUserThemeCssVariables>>;

export function createUserThemeInitScript(storageScope: string) {
  const storageKey = getUserThemeStorageKey(storageScope);

  return `
    (() => {
      const storageKey = ${JSON.stringify(storageKey)};
      const legacyStorageKey = ${JSON.stringify(legacyUserThemeStorageKey)};
      const defaultThemeKey = ${JSON.stringify(defaultUserThemeKey)};
      const cssVariablesByThemeKey = ${JSON.stringify(userThemeCssVariablesByKey)};

      try {
        const savedThemeKey = window.localStorage.getItem(storageKey);
        const legacyThemeKey = window.localStorage.getItem(legacyStorageKey);
        const themeKey = cssVariablesByThemeKey[savedThemeKey]
          ? savedThemeKey
          : cssVariablesByThemeKey[legacyThemeKey]
            ? legacyThemeKey
            : defaultThemeKey;
        const cssVariables = cssVariablesByThemeKey[themeKey];
        const root = document.documentElement;

        root.setAttribute("data-user-theme", themeKey);

        Object.entries(cssVariables).forEach(([name, value]) => {
          root.style.setProperty(name, value);
        });
      } catch {
        document.documentElement.setAttribute("data-user-theme", defaultThemeKey);
      }
    })();
  `;
}
