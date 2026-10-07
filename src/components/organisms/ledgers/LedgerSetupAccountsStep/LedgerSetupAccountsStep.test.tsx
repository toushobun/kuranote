import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi, type Mock } from "vitest";

import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
  ledgerSetupWriteErrorMessages,
  type LedgerSetupDraftAccount,
  type LedgerSetupTemplate,
} from "internal/ledger";
import {
  changeAccountName,
  clickAccountCandidate,
  getAccountAddSheet,
  submitAccountAddSheet,
} from "organisms/ledgers/LedgerSetupAccountAddSheet/ledgerSetupAccountAddSheetTestUtils";
import {
  clickCloseWizard,
  clickNext,
  createSaveDraftMock,
  getCurrentStepItem,
  goPreviousTo,
  renderLedgerSetupWizard,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardTestUtils";
import {
  createLedgerSetupProgressFixture,
  ledgerSetupTemplateFixture,
} from "test/mocks/ledgerSetup";
import type { LedgerSetupDraftSaveAction } from "types/ledgers";

function createAccountsProgress(
  items: LedgerSetupDraftAccount[] = [{ name: "现金", type: "cash" }],
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

function getAccountCard(typeLabel: string) {
  return screen.getByRole("region", { name: typeLabel });
}

function getAccountCheckbox(name: string) {
  return screen.getByRole("checkbox", { name });
}

function openAddSheet(typeLabel: string) {
  fireEvent.click(screen.getByRole("button", { name: `添加${typeLabel}` }));
  return getAccountAddSheet(typeLabel);
}

/** 第一次保存草稿时的参数。 */
function getSavedInput(saveDraft: Mock<LedgerSetupDraftSaveAction>) {
  return saveDraft.mock.calls[0][0];
}

describe("LedgerSetupAccountsStep", () => {
  it("显示引导文案与按类型分组的卡片，默认只有勾选的「现金」", () => {
    renderAccountsStep();

    expect(
      screen.getByRole("heading", { name: "你平时用哪些方式付钱？" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("勾选或添加你的账户，之后也可以在账户管理中修改"),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("heading", { level: 4 })
        .map((heading) => heading.textContent),
    ).toEqual(["现金", "银行卡", "信用卡", "电子钱包"]);
    expect(
      within(getAccountCard("现金")).getByRole("checkbox", { name: "现金" }),
    ).toBeChecked();
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "下一步 · 已选 1 个" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "跳过此步" }),
    ).toBeInTheDocument();
  });

  it("取消勾选后账户仍保留在列表中，可以重新勾选，按钮显示已选数量", () => {
    renderAccountsStep({
      progress: createAccountsProgress([
        { name: "现金", type: "cash" },
        { name: "PayPay", type: "e_money" },
      ]),
    });

    expect(
      screen.getByRole("button", { name: "下一步 · 已选 2 个" }),
    ).toBeInTheDocument();

    fireEvent.click(getAccountCheckbox("PayPay"));
    expect(getAccountCheckbox("PayPay")).not.toBeChecked();
    expect(
      screen.getByRole("button", { name: "下一步 · 已选 1 个" }),
    ).toBeInTheDocument();

    fireEvent.click(getAccountCheckbox("现金"));
    expect(screen.getByRole("button", { name: "下一步" })).toBeEnabled();

    fireEvent.click(getAccountCheckbox("PayPay"));
    expect(getAccountCheckbox("PayPay")).toBeChecked();
    expect(
      screen.getByRole("button", { name: "下一步 · 已选 1 个" }),
    ).toBeInTheDocument();
  });

  it("下一步时只保存勾选的账户，skipped 为 false，setup_step 为第 3 步", async () => {
    const progress = createAccountsProgress([
      { name: "现金", type: "cash" },
      { name: "楽天銀行", templateKey: "楽天銀行", type: "bank" },
    ]);
    const saveDraft = createSaveDraftMock(progress);
    renderAccountsStep({ progress, saveDraft });

    fireEvent.click(getAccountCheckbox("现金"));
    clickNext();

    await waitFor(() => expect(getCurrentStepItem()).toHaveTextContent("商家"));
    expect(getSavedInput(saveDraft)).toEqual({
      draft: {
        ...progress.setup.draft,
        accounts: {
          items: [{ name: "楽天銀行", templateKey: "楽天銀行", type: "bank" }],
          skipped: false,
        },
      },
      ledgerId: progress.setup.id,
      step: 3,
    });
  });

  it("勾选数为 0 时也可以下一步，保存空的账户列表", async () => {
    const { saveDraft } = renderAccountsStep();

    fireEvent.click(getAccountCheckbox("现金"));
    clickNext();

    await waitFor(() => expect(saveDraft).toHaveBeenCalledTimes(1));
    expect(getSavedInput(saveDraft).draft.accounts).toEqual({
      items: [],
      skipped: false,
    });
  });

  it("跳过此步时 skipped 为 true，并保留当前勾选的账户", async () => {
    const { saveDraft } = renderAccountsStep();

    fireEvent.click(screen.getByRole("button", { name: "跳过此步" }));

    await waitFor(() => expect(getCurrentStepItem()).toHaveTextContent("商家"));
    expect(getSavedInput(saveDraft)).toMatchObject({
      draft: {
        accounts: { items: [{ name: "现金", type: "cash" }], skipped: true },
      },
      step: 3,
    });
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
    fireEvent.click(getAccountCheckbox("现金"));
    await goPreviousTo("基本信息");

    expect(saveDraft.mock.lastCall?.[0]).toMatchObject({
      draft: { accounts: { items: [], skipped: false } },
      step: 4,
    });
  });

  it("取消勾选并保存后，再次进入该步骤时不再显示已取消的账户", async () => {
    renderAccountsStep({
      progress: createAccountsProgress([
        { name: "现金", type: "cash" },
        { name: "PayPay", type: "e_money" },
      ]),
    });

    fireEvent.click(getAccountCheckbox("PayPay"));
    clickNext();
    await waitFor(() => expect(getCurrentStepItem()).toHaveTextContent("商家"));
    await goPreviousTo("账户");

    expect(screen.queryByRole("checkbox", { name: "PayPay" })).toBeNull();
    expect(getAccountCheckbox("现金")).toBeChecked();
  });

  it("保存中禁用操作栏与关闭按钮，并显示 loading", async () => {
    renderAccountsStep({
      saveDraft: vi.fn<LedgerSetupDraftSaveAction>(() => new Promise(() => {})),
    });

    clickNext();

    expect(
      await screen.findByRole("progressbar", { name: "保存中" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存中" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "上一步" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "跳过此步" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "关闭创建账本向导" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "添加银行卡" })).toBeDisabled();

    clickCloseWizard();
    expect(
      screen.queryByRole("dialog", { name: "稍后再继续？" }),
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
    expect(alert).toHaveTextContent("创建进度保存失败");
    expect(alert).toHaveTextContent(
      ledgerSetupWriteErrorMessages.draftSaveFailed,
    );
    expect(getCurrentStepItem()).toHaveTextContent("账户");
    expect(
      screen.getByRole("button", { name: "下一步 · 已选 1 个" }),
    ).toBeEnabled();
  });

  it("预设内容已更新时用重新读取的进度刷新列表，并在顶部提示重新确认", async () => {
    const refreshed = createAccountsProgress([
      { name: "现金", type: "cash" },
      { name: "楽天銀行", type: "bank" },
    ]);
    renderAccountsStep({
      saveDraft: vi.fn(async () => ({ outdated: true, progress: refreshed })),
    });

    fireEvent.click(getAccountCheckbox("现金"));
    clickNext();

    expect(await screen.findByRole("status")).toHaveTextContent(
      "预设内容已更新，请重新确认",
    );
    expect(getCurrentStepItem()).toHaveTextContent("账户");
    expect(getAccountCheckbox("现金")).toBeChecked();
    expect(getAccountCheckbox("楽天銀行")).toBeChecked();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("服务端判定同类型账户重名时在对应账户下方提示，不显示失败弹框", async () => {
    const message =
      ledgerSetupErrorMessages[ledgerSetupErrorCodes.accountNameDuplicate];
    renderAccountsStep({
      progress: createAccountsProgress([
        { name: "现金", type: "cash" },
        { name: "PayPay", type: "e_money" },
        { name: "paypay", type: "e_money" },
      ]),
      saveDraft: vi.fn(async () => ({
        accountNameDuplicate: true,
        error: message,
        errorKey: "e1",
      })),
    });

    clickNext();

    await waitFor(() =>
      expect(
        within(getAccountCard("电子钱包")).getAllByText(message),
      ).toHaveLength(2),
    );
    expect(within(getAccountCard("现金")).queryByText(message)).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(getCurrentStepItem()).toHaveTextContent("账户");
  });

  describe("添加账户", () => {
    it("从候选添加后关闭弹层，新账户以勾选状态出现在对应卡片末尾", async () => {
      const { saveDraft } = renderAccountsStep({
        progress: createAccountsProgress([
          { name: "现金", type: "cash" },
          { name: "楽天銀行", type: "bank" },
        ]),
      });

      const sheet = openAddSheet("银行卡");
      clickAccountCandidate(sheet, "三菱UFJ銀行");
      submitAccountAddSheet(sheet);

      await waitFor(() =>
        expect(screen.queryByRole("dialog", { name: "添加银行卡" })).toBeNull(),
      );
      const bankCheckboxes = within(getAccountCard("银行卡")).getAllByRole(
        "checkbox",
      );
      expect(
        bankCheckboxes.map(
          (checkbox) => checkbox.closest("label")?.textContent,
        ),
      ).toEqual(["楽天銀行", "三菱UFJ銀行"]);
      expect(getAccountCheckbox("三菱UFJ銀行")).toBeChecked();
      expect(
        screen.getByRole("button", { name: "下一步 · 已选 3 个" }),
      ).toBeInTheDocument();

      clickNext();
      await waitFor(() => expect(saveDraft).toHaveBeenCalledTimes(1));
      expect(getSavedInput(saveDraft).draft.accounts.items).toContainEqual({
        name: "三菱UFJ銀行",
        templateKey: "三菱UFJ銀行",
        type: "bank",
      });
    });

    it("取消勾选的账户也视为已添加，不能再添加同名账户", () => {
      renderAccountsStep({
        progress: createAccountsProgress([
          { name: "现金", type: "cash" },
          { name: "PayPay", type: "e_money" },
        ]),
      });

      fireEvent.click(getAccountCheckbox("PayPay"));
      const sheet = openAddSheet("电子钱包");

      expect(
        within(sheet).getByRole("button", { name: "PayPay 已添加" }),
      ).toBeInTheDocument();
      changeAccountName(sheet, "paypay");
      expect(
        within(sheet).getByText("已有同名账户，请修改名称"),
      ).toBeInTheDocument();
    });

    it("现金类型不显示候选", () => {
      renderAccountsStep();

      const sheet = openAddSheet("现金");

      expect(within(sheet).queryByRole("heading", { level: 3 })).toBeNull();
    });

    it("当前币种没有模板时不显示候选", () => {
      renderAccountsStep({
        progress: createAccountsProgress(undefined, null),
      });

      const sheet = openAddSheet("银行卡");

      expect(
        within(sheet).queryByRole("heading", { name: "常用银行卡" }),
      ).toBeNull();
    });

    it("账户数达到上限时禁用添加并说明原因", () => {
      const items = Array.from({ length: 50 }, (_, index) => ({
        name: `银行 ${index + 1}`,
        type: "bank" as const,
      }));
      renderAccountsStep({ progress: createAccountsProgress(items) });

      for (const label of ["现金", "银行卡", "信用卡", "电子钱包"]) {
        expect(
          screen.getByRole("button", { name: `添加${label}` }),
        ).toBeDisabled();
      }
      expect(
        screen.getByText("账户最多 50 个，已达到上限"),
      ).toBeInTheDocument();
    });
  });
});
