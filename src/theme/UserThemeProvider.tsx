"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { routePaths } from "config/paths";
import {
  defaultTransactionColorScheme,
  type TransactionColorScheme,
} from "internal/user";
import { getUserThemeCssVariables } from "theme/userThemeCssVariables";
import {
  defaultUserThemeKey,
  type UserThemeKey,
  userThemeKeys,
  userThemeTokens,
} from "theme/userThemeTokens";
import { userThemeCookieName } from "theme/userThemeStorage";

type UserThemeContextValue = {
  themeKey: UserThemeKey;
  setThemeKey: (themeKey: UserThemeKey) => void;
  setTransactionColorScheme: (scheme: TransactionColorScheme) => void;
  themeKeys: typeof userThemeKeys;
  tokens: typeof userThemeTokens;
  transactionColorScheme: TransactionColorScheme;
};

const UserThemeContext = createContext<UserThemeContextValue | null>(null);

// 仅列出 protected layout 下的入口路由；home("/") / login("/login") 等公开路由有意排除。
const protectedRoutePrefixes = [
  routePaths.accounts,
  routePaths.categories,
  routePaths.dashboard,
  routePaths.ledgers,
  routePaths.merchants,
  routePaths.settings,
  routePaths.statistics,
  routePaths.transactions,
] as const;

// AppShell 同一时刻只会挂载一个用户主题 provider；这个共享槽用于跨过 React 卸载/重挂载间隙。
// Suspense 或懒加载可能让新 provider 晚于下一轮任务挂载，所以执行重置前还要确认当前路径已经离开 protected 区域。
let pendingDefaultThemeResetId: number | null = null;

type UserThemeProviderProps = {
  children: ReactNode;
  /** 服务端从 app_user.theme_key 读取的主题，SSR 与 hydration 首帧直接使用。 */
  initialThemeKey?: UserThemeKey;
  initialTransactionColorScheme?: TransactionColorScheme;
};

export function UserThemeProvider({
  children,
  initialThemeKey = defaultUserThemeKey,
  initialTransactionColorScheme = defaultTransactionColorScheme,
}: UserThemeProviderProps) {
  const [themeKey, setThemeKeyState] = useState(initialThemeKey);
  const [transactionColorScheme, setTransactionColorSchemeState] = useState(
    initialTransactionColorScheme,
  );
  const [syncedInitialThemeKey, setSyncedInitialThemeKey] =
    useState(initialThemeKey);

  // 服务端重新下发主题（例如刷新后读到其他设备的修改）时，以数据库值为准。
  if (syncedInitialThemeKey !== initialThemeKey) {
    setSyncedInitialThemeKey(initialThemeKey);
    setThemeKeyState(initialThemeKey);
  }

  useEffect(() => {
    cancelDefaultUserThemeReset();

    return () => {
      scheduleDefaultUserThemeReset();
    };
  }, []);

  useLayoutEffect(() => {
    // <html> 上的 CSS 变量与 cookie 只是缓存，始终跟随当前主题（数据库值或乐观更新值）。
    applyUserTheme(themeKey, transactionColorScheme);
    syncThemeCookie(themeKey);
  }, [themeKey, transactionColorScheme]);

  const setThemeKey = useCallback((nextThemeKey: UserThemeKey) => {
    setThemeKeyState(nextThemeKey);
  }, []);

  const setTransactionColorScheme = useCallback(
    (nextScheme: TransactionColorScheme) => {
      setTransactionColorSchemeState(nextScheme);
    },
    [],
  );

  const value = useMemo(
    () => ({
      themeKey,
      setThemeKey,
      setTransactionColorScheme,
      themeKeys: userThemeKeys,
      tokens: userThemeTokens,
      transactionColorScheme,
    }),
    [setThemeKey, setTransactionColorScheme, themeKey, transactionColorScheme],
  );

  return (
    <UserThemeContext.Provider value={value}>
      {children}
    </UserThemeContext.Provider>
  );
}

export function useUserTheme() {
  const context = useContext(UserThemeContext);

  if (!context) {
    throw new Error("useUserTheme must be used inside UserThemeProvider");
  }

  return context;
}

function syncThemeCookie(themeKey: UserThemeKey) {
  const maxAge = 365 * 24 * 60 * 60;
  document.cookie = `${userThemeCookieName}=${themeKey}; path=/; max-age=${maxAge}; samesite=lax`;
}

function clearThemeCookie() {
  document.cookie = `${userThemeCookieName}=; path=/; max-age=0; samesite=lax`;
}

function applyUserTheme(
  themeKey: UserThemeKey,
  transactionColorScheme: TransactionColorScheme = defaultTransactionColorScheme,
) {
  const root = document.documentElement;
  const cssVariables = getUserThemeCssVariables(
    themeKey,
    transactionColorScheme,
  );

  root.setAttribute("data-user-theme", themeKey);

  Object.entries(cssVariables).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });
}

function cancelDefaultUserThemeReset() {
  if (pendingDefaultThemeResetId === null) {
    return;
  }

  window.clearTimeout(pendingDefaultThemeResetId);
  pendingDefaultThemeResetId = null;
}

function scheduleDefaultUserThemeReset() {
  if (pendingDefaultThemeResetId !== null) {
    return;
  }

  pendingDefaultThemeResetId = window.setTimeout(() => {
    pendingDefaultThemeResetId = null;

    if (isCurrentPathProtectedRoute()) {
      return;
    }

    applyUserTheme(defaultUserThemeKey);
    clearThemeCookie();
  }, 0);
}

function isCurrentPathProtectedRoute() {
  const { pathname } = window.location;

  return protectedRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
