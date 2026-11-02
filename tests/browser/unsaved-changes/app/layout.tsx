import { ToolbarMetrics } from "./probe";
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
        <ToolbarMetrics />
        {/* 验证填充只提供滚动空间，不作为跨路由的浏览器滚动锚点。 */}
        <div aria-hidden style={{ height: 3200, overflowAnchor: "none" }} />
      </AppShell>
    </RootLayoutShell>
  );
}
