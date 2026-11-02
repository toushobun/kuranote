import type { ReactNode } from "react";

import { UnsavedChangesGuardProvider } from "providers/UnsavedChangesGuardProvider/UnsavedChangesGuardProvider";

import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { UserThemeProvider } from "theme/UserThemeProvider";

/** 使用 useConfirmDialog() 的组件测试共用的 Provider 组合。 */
export function ConfirmDialogTestProviders({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <UserThemeProvider>
      <UnsavedChangesGuardProvider>
        <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
      </UnsavedChangesGuardProvider>
    </UserThemeProvider>
  );
}
