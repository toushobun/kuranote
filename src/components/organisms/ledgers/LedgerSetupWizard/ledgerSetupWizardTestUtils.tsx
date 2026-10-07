import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { expect, vi, type Mock } from "vitest";

import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";
import type {
  LedgerSetupBasicInfoStateAction,
  LedgerSetupDraftSaveAction,
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
  saveDraft?: Mock<LedgerSetupDraftSaveAction>;
  submitBasicInfo?: LedgerSetupBasicInfoStateAction;
};

/** 模拟保存草稿成功：返回保存了该草稿与步骤后的进度。 */
export function createSaveDraftMock(
  progress: LedgerSetupProgress = createLedgerSetupProgressFixture(),
) {
  return vi.fn<LedgerSetupDraftSaveAction>(async ({ draft, step }) => ({
    progress: { ...progress, setup: { ...progress.setup, draft, step } },
  }));
}

/** 创建账本向导测试共用的渲染：提供 ConfirmDialog / 用户主题 Provider，并返回回调 mock。 */
export function renderLedgerSetupWizard({
  progress = null,
  saveDraft = createSaveDraftMock(progress ?? undefined),
  submitBasicInfo = vi.fn(async () => ({})),
}: RenderLedgerSetupWizardOptions = {}) {
  const onClose = vi.fn();

  render(
    <ConfirmDialogTestProviders>
      <LedgerSetupWizard
        actions={{ saveDraft, submitBasicInfo }}
        defaults={ledgerSetupWizardTestDefaults}
        onClose={onClose}
        open
        progress={progress}
      />
    </ConfirmDialogTestProviders>,
  );

  return { onClose, saveDraft, submitBasicInfo };
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

/** 点击「下一步」。账户步骤的按钮带已选数量（「下一步 · 已选 N 个」），按前缀匹配。 */
export function clickNext() {
  fireEvent.click(screen.getByRole("button", { name: /^下一步/ }));
}

export function clickPrevious() {
  fireEvent.click(screen.getByRole("button", { name: "上一步" }));
}

/** 点击「上一步」并等待切换到指定步骤（第 2 步以后会先保存草稿）。 */
export async function goPreviousTo(stepLabel: string) {
  clickPrevious();
  await waitFor(() =>
    expect(getCurrentStepItem()).toHaveTextContent(stepLabel),
  );
}

export function clickCloseWizard() {
  fireEvent.click(screen.getByRole("button", { name: "关闭创建账本向导" }));
}
