import type { ReactNode } from "react";
import { RootLayoutShell } from "../../../../src/components/templates/root/RootLayoutShell";
import { AppShell } from "../../../../src/components/templates/protected/AppShell";
import {
  defaultUserThemeKey,
  defaultTransactionColorScheme,
} from "../../../../src/internal/user";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootLayoutShell>
      <AppShell
        canWriteTransactions={false}
        themeKey={defaultUserThemeKey}
        transactionColorScheme={defaultTransactionColorScheme}
      >
        {children}
        {/* 留出长页滚动空间，避免浏览器因页面高度不足而钳制验证位置。 */}
        <div aria-hidden style={{ height: 3200 }} />
      </AppShell>
    </RootLayoutShell>
  );
}
