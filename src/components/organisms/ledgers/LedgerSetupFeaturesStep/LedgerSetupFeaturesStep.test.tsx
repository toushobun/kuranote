import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  clickNext,
  createSaveDraftMock,
  getCurrentStepItem,
  getSavedInput,
  goPreviousTo,
  renderLedgerSetupWizard,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardTestUtils";
import { ledgerFeatureSettingMessages } from "config/ledgerMessages";
import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";
import type { LedgerSetupDraftSaveAction } from "types/ledgers";

function createFeaturesProgress(
  specialStatusEnabled = false,
  multiAccountPaymentEnabled = false,
) {
  const base = createLedgerSetupProgressFixture({ step: 4 });
  return createLedgerSetupProgressFixture({
    draft: {
      ...base.setup.draft,
      features: { multiAccountPaymentEnabled, specialStatusEnabled },
    },
    step: 4,
  });
}

function getSpecialStatusSwitch() {
  return screen.getByRole("switch", { name: "启用特殊状态" });
}

function getMultiAccountPaymentSwitch() {
  return screen.getByRole("switch", {
    name: ledgerFeatureSettingMessages.multiAccountPayment.switchLabel,
  });
}

describe("LedgerSetupFeaturesStep", () => {
  it("显示引导文案与特殊状态开关，没有跳过此步", () => {
    renderLedgerSetupWizard({ progress: createFeaturesProgress() });

    expect(getCurrentStepItem()).toHaveTextContent("功能");
    expect(
      screen.getByRole("heading", { name: "需要这些功能吗？" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("可以随时在账本设置中开启或关闭"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "上一步" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "跳过此步" }),
    ).not.toBeInTheDocument();
  });

  it.each([false, true])("初始值来自草稿（%s）", (enabled) => {
    renderLedgerSetupWizard({
      progress: createFeaturesProgress(enabled, !enabled),
    });

    expect(getSpecialStatusSwitch()).toHaveProperty("checked", enabled);
    expect(getMultiAccountPaymentSwitch()).toHaveProperty("checked", !enabled);
  });

  it("开启多账户付款时不显示已有账本才适用的「无法关闭」说明", () => {
    renderLedgerSetupWizard({ progress: createFeaturesProgress(false, true) });

    expect(
      screen.queryByText(
        ledgerFeatureSettingMessages.multiAccountPayment.enabledDescription,
      ),
    ).not.toBeInTheDocument();
  });

  it("关闭状态下不显示已有账本才适用的「将无法关闭」说明", () => {
    renderLedgerSetupWizard({ progress: createFeaturesProgress(false) });

    expect(screen.queryByText(/将无法关闭/)).not.toBeInTheDocument();
    expect(screen.queryByText(/只有管理员或所有者/)).not.toBeInTheDocument();
  });

  it("切换开关后下一步保存功能设置，setup_step 保存为 5 并进入确认一览", async () => {
    const progress = createFeaturesProgress(false);
    const saveDraft = createSaveDraftMock(progress);
    renderLedgerSetupWizard({ progress, saveDraft });

    fireEvent.click(getSpecialStatusSwitch());
    fireEvent.click(getMultiAccountPaymentSwitch());
    expect(getSpecialStatusSwitch()).toBeChecked();
    expect(getMultiAccountPaymentSwitch()).toBeChecked();
    clickNext();

    await waitFor(() => expect(getCurrentStepItem()).toHaveTextContent("确认"));
    expect(getSavedInput(saveDraft)).toEqual({
      draft: {
        ...progress.setup.draft,
        features: {
          multiAccountPaymentEnabled: true,
          specialStatusEnabled: true,
        },
      },
      ledgerId: progress.setup.id,
      step: 5,
    });
  });

  it("上一步时同样保存功能设置，setup_step 不倒退", async () => {
    const progress = createFeaturesProgress(true, true);
    const saveDraft = createSaveDraftMock(progress);
    renderLedgerSetupWizard({ progress, saveDraft });

    fireEvent.click(getSpecialStatusSwitch());
    await goPreviousTo("商家");

    expect(getSavedInput(saveDraft)).toEqual({
      draft: {
        ...progress.setup.draft,
        features: {
          multiAccountPaymentEnabled: true,
          specialStatusEnabled: false,
        },
      },
      ledgerId: progress.setup.id,
      step: 4,
    });
  });

  it("保存中锁定上一步与关闭按钮", async () => {
    renderLedgerSetupWizard({
      progress: createFeaturesProgress(),
      saveDraft: vi.fn<LedgerSetupDraftSaveAction>(() => new Promise(() => {})),
    });

    clickNext();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "保存中" })).toBeDisabled(),
    );
    expect(screen.getByRole("button", { name: "上一步" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "关闭创建账本向导" }),
    ).toBeDisabled();
  });
});
