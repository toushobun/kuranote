import { fireEvent, render, screen, within } from "@testing-library/react";
import { vi } from "vitest";

import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import type {
  LedgerSetupBasicInfoStateAction,
  LedgerSetupProgress,
} from "types/ledgers";

import { LedgerSetupWizard } from "./LedgerSetupWizard";

export const ledgerSetupWizardTestDefaults = {
  baseCurrency: "JPY",
  displayColor: "amber" as const,
  displayName: "DENG SONGWEN",
  ledgerName: "家庭账本",
};

type RenderLedgerSetupWizardOptions = {
  progress?: LedgerSetupProgress | null;
  submitBasicInfo?: LedgerSetupBasicInfoStateAction;
};

/** 创建账本向导测试共用的渲染：提供 ConfirmDialog / 用户主题 Provider，并返回回调 mock。 */
export function renderLedgerSetupWizard({
  progress = null,
  submitBasicInfo = vi.fn(async () => ({})),
}: RenderLedgerSetupWizardOptions = {}) {
  const onClose = vi.fn();

  render(
    <ConfirmDialogTestProviders>
      <LedgerSetupWizard
        actions={{ submitBasicInfo }}
        defaults={ledgerSetupWizardTestDefaults}
        onClose={onClose}
        open
        progress={progress}
      />
    </ConfirmDialogTestProviders>,
  );

  return { onClose, submitBasicInfo };
}

export function getLedgerSetupWizardDialog() {
  return screen.getByRole("dialog", { name: "创建账本" });
}

/** 进度条中当前步骤的标签。 */
export function getCurrentStepItem() {
  return within(screen.getByRole("list", { name: "创建进度" }))
    .getAllByRole("listitem")
    .find((item) => item.getAttribute("aria-current") === "step");
}

export function clickNext() {
  fireEvent.click(screen.getByRole("button", { name: "下一步" }));
}

export function clickPrevious() {
  fireEvent.click(screen.getByRole("button", { name: "上一步" }));
}

export function clickCloseWizard() {
  fireEvent.click(screen.getByRole("button", { name: "关闭创建账本向导" }));
}
