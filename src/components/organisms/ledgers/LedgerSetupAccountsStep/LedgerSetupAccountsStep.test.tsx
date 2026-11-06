import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi, type Mock } from "vitest";

import {
  getLedgerSetupTemplate,
  ledgerSetupWriteErrorMessages,
  type LedgerSetupDraftAccount,
  type LedgerSetupTemplate,
} from "internal/ledger";
import {
  getChecklistGroup,
  getChecklistItemCheckbox,
  toggleChecklistGroup,
} from "molecules/ui/GroupedPresetChecklist/groupedPresetChecklistTestUtils";
import {
  clickCloseWizard,
  clickNext,
  createSaveDraftMock,
  getCurrentStepItem,
  getSavedInput,
  goPreviousTo,
  renderLedgerSetupWizard,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardTestUtils";
import {
  createLedgerSetupProgressFixture,
  ledgerSetupTemplateFixture,
} from "test/mocks/ledgerSetup";
import { backFromGuard, setupGuardHistoryMock } from "test/mockGuardHistory";
import type { LedgerSetupDraftSaveAction } from "types/ledgers";

setupGuardHistoryMock();

const yenCash: LedgerSetupDraftAccount = {
  name: "日元现金",
  templateKey: "日元现金",
  type: "cash",
};
const rakutenBank: LedgerSetupDraftAccount = {
  name: "楽天銀行",
  templateKey: "楽天銀行",
  type: "bank",
};

function createAccountsProgress(
  items: LedgerSetupDraftAccount[] = [yenCash],
  template: LedgerSetupTemplate | null = ledgerSetupTemplateFixture,
) {
  const base = createLedgerSetupProgressFixture({ step: 2 });
  return createLedgerSetupProgressFixture(
    {
      draft: { ...base.setup.draft, accounts: { items, skipped: false } },
      step: 2,
    },
    template,
  );
}

/** 渲染停在第 2 步「账户」的向导。 */
function renderAccountsStep({
  progress = createAccountsProgress(),
  saveDraft = createSaveDraftMock(progress),
}: {
  progress?: ReturnType<typeof createAccountsProgress>;
  saveDraft?: Mock<LedgerSetupDraftSaveAction>;
} = {}) {
  return renderLedgerSetupWizard({ progress, saveDraft });
}

function getRegionButton(title: string) {
  return screen.getByRole("button", { name: title });
}

function getTypeCheckbox(typeLabel: string, index = 0) {
  return within(getChecklistGroup(typeLabel, index)).getByRole("checkbox", {
    name: `选择「${typeLabel}」的全部账户`,
  });
}

function expectNextLabel(label: string) {
  expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
}

describe("LedgerSetupAccountsStep", () => {
  it("与商家步骤相同按地区分卡、卡内按类型分行，默认只勾生活地区的现金", () => {
    renderAccountsStep();

    expect(
      screen.getByRole("heading", { name: "你平时用哪些方式付钱？" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("勾选常用的账户，没有的可以稍后在账户管理中添加"),
    ).toBeInTheDocument();
    expect(getRegionButton("日本常用账户")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(getRegionButton("中国常用账户")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(getRegionButton("日本常用账户")).toHaveAccessibleDescription(
      "已选 1 个",
    );
    expect(getTypeCheckbox("现金")).toBeChecked();
    expect(getChecklistGroup("银行卡")).toHaveTextContent("0 / 3");
    expectNextLabel("下一步 · 已选 1 个");
    expect(screen.queryByRole("button", { name: /^添加/ })).toBeNull();
  });

  it("可以整类勾选，也可以展开后逐个勾选", () => {
    renderAccountsStep();

    fireEvent.click(getTypeCheckbox("银行卡"));
    expectNextLabel("下一步 · 已选 4 个");

    toggleChecklistGroup("银行卡");
    fireEvent.click(getChecklistItemCheckbox("银行卡", "楽天銀行"));
    expect(getTypeCheckbox("银行卡")).toHaveAttribute(
      "data-indeterminate",
      "true",
    );
    expectNextLabel("下一步 · 已选 3 个");
  });

  it("下一步时按模板顺序保存勾选的候选，setup_step 为第 3 步", async () => {
    const progress = createAccountsProgress([rakutenBank, yenCash]);
    const saveDraft = createSaveDraftMock(progress);
    renderAccountsStep({ progress, saveDraft });

    fireEvent.click(getRegionButton("中国常用账户"));
    fireEvent.click(getTypeCheckbox("电子钱包", 1));
    clickNext();

    await waitFor(() => expect(getCurrentStepItem()).toHaveTextContent("商家"));
    expect(getSavedInput(saveDraft)).toEqual({
      draft: {
        ...progress.setup.draft,
        accounts: {
          items: [
            yenCash,
            rakutenBank,
            { name: "支付宝", templateKey: "支付宝", type: "e_money" },
            { name: "微信支付", templateKey: "微信支付", type: "e_money" },
          ],
          skipped: false,
        },
      },
      ledgerId: progress.setup.id,
      step: 3,
    });
  });

  it("勾选数为 0 时也可以下一步，保存空的账户列表", async () => {
    const { saveDraft } = renderAccountsStep();

    fireEvent.click(getTypeCheckbox("现金"));
    clickNext();

    await waitFor(() => expect(saveDraft).toHaveBeenCalledTimes(1));
    expect(getSavedInput(saveDraft).draft.accounts).toEqual({
      items: [],
      skipped: false,
    });
  });

  it("另一地区有勾选时默认展开", () => {
    renderAccountsStep({
      progress: createAccountsProgress([
        yenCash,
        { name: "支付宝", templateKey: "支付宝", type: "e_money" },
      ]),
    });

    expect(getRegionButton("中国常用账户")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(getRegionButton("中国常用账户")).toHaveAccessibleDescription(
      "已选 1 个",
    );
  });

  it("勾选超过上限时提示并禁用下一步与上一步（不触发必然失败的保存），减少后恢复", () => {
    renderAccountsStep({
      progress: createAccountsProgress([], getLedgerSetupTemplate("jp")),
    });
    fireEvent.click(getRegionButton("中国常用账户"));
    for (const type of ["现金", "银行卡", "信用卡", "电子钱包"]) {
      fireEvent.click(getTypeCheckbox(type, 0));
      fireEvent.click(getTypeCheckbox(type, 1));
    }

    expect(screen.getByRole("status")).toHaveTextContent(
      "账户最多 50 个，请减少勾选",
    );
    expect(
      screen.getByRole("button", { name: /^下一步 · 已选 \d+ 个$/ }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "上一步" })).toBeDisabled();

    fireEvent.click(getTypeCheckbox("电子钱包", 0));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^下一步 · 已选 \d+ 个$/ }),
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "上一步" })).toBeEnabled();
  });

  it("上一步时保存当前修改，setup_step 不倒退", async () => {
    const progress = createAccountsProgress();
    const saveDraft = createSaveDraftMock(progress);
    renderLedgerSetupWizard({
      progress: { ...progress, setup: { ...progress.setup, step: 4 } },
      saveDraft,
    });

    // 从第 4 步恢复后返回第 3 步、第 2 步（第 3 步返回时也会保存草稿）。
    await goPreviousTo("商家");
    await goPreviousTo("账户");
    fireEvent.click(getTypeCheckbox("现金"));
    await goPreviousTo("基本信息");

    expect(saveDraft.mock.lastCall?.[0]).toMatchObject({
      draft: { accounts: { items: [], skipped: false } },
      step: 4,
    });
  });

  it("保存中禁用操作栏、勾选、关闭按钮和浏览器后退，并显示 loading", async () => {
    const { onClose } = renderAccountsStep({
      saveDraft: vi.fn<LedgerSetupDraftSaveAction>(() => new Promise(() => {})),
    });

    clickNext();

    expect(
      await screen.findByRole("progressbar", { name: "保存中" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存中" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "上一步" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "关闭创建账本向导" }),
    ).toBeDisabled();
    expect(getTypeCheckbox("银行卡")).toBeDisabled();

    clickCloseWizard();
    await backFromGuard();
    expect(onClose).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("dialog", { name: "尚未保存" }),
    ).not.toBeInTheDocument();
  });

  it("保存失败时显示失败反馈并留在当前步骤", async () => {
    const message = "创建进度保存失败，请稍后重试。";
    renderAccountsStep({
      saveDraft: vi.fn(async () => ({ error: message, errorKey: "e1" })),
    });

    clickNext();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("创建进度保存失败");
    expect(alert).toHaveTextContent(message);
    expect(getCurrentStepItem()).toHaveTextContent("账户");
  });

  it("saveDraft 抛出异常（网络断开等）时显示失败提示且不切换步骤", async () => {
    renderAccountsStep({
      saveDraft: vi.fn<LedgerSetupDraftSaveAction>(async () => {
        throw new Error("network error");
      }),
    });

    clickNext();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      ledgerSetupWriteErrorMessages.draftSaveFailed,
    );
    expect(getCurrentStepItem()).toHaveTextContent("账户");
    expect(
      screen.getByRole("button", { name: "下一步 · 已选 1 个" }),
    ).toBeEnabled();
  });

  it("预设内容已更新时用重新读取的进度刷新勾选，并在顶部提示重新确认", async () => {
    const refreshed = createAccountsProgress([yenCash, rakutenBank]);
    renderAccountsStep({
      saveDraft: vi.fn(async () => ({ outdated: true, progress: refreshed })),
    });

    fireEvent.click(getTypeCheckbox("现金"));
    clickNext();

    expect(await screen.findByRole("status")).toHaveTextContent(
      "预设内容已更新，请重新确认",
    );
    expect(getCurrentStepItem()).toHaveTextContent("账户");
    expect(getTypeCheckbox("现金")).toBeChecked();
    expectNextLabel("下一步 · 已选 2 个");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
