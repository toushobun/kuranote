import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { LedgerSetupDraftAccount } from "internal/ledger";
import { ledgerSetupTemplateFixture } from "test/mocks/ledgerSetup";

import { LedgerSetupAccountAddSheet } from "./LedgerSetupAccountAddSheet";
import {
  changeAccountName,
  clickAccountCandidate,
  getAccountAddSheet,
  getAccountNameInput,
  submitAccountAddSheet,
} from "./ledgerSetupAccountAddSheetTestUtils";

const bankCandidates = ledgerSetupTemplateFixture.accountCandidates.bank;

function renderSheet({
  accounts = [{ name: "现金", type: "cash" }],
  candidates = bankCandidates,
}: {
  accounts?: LedgerSetupDraftAccount[];
  candidates?: readonly string[];
} = {}) {
  const onAdd = vi.fn();
  const onClose = vi.fn();

  render(
    <LedgerSetupAccountAddSheet
      accounts={accounts}
      candidates={candidates}
      onAdd={onAdd}
      onClose={onClose}
      open
      type="bank"
    />,
  );

  return { onAdd, onClose, sheet: getAccountAddSheet("银行卡") };
}

describe("LedgerSetupAccountAddSheet", () => {
  it("显示标题、输入框、常用候选与添加按钮", () => {
    const { sheet } = renderSheet();

    expect(
      within(sheet).getByRole("heading", { name: "添加银行卡" }),
    ).toBeInTheDocument();
    expect(getAccountNameInput(sheet)).toHaveAttribute(
      "placeholder",
      "输入名称或从下方选择",
    );
    expect(
      within(sheet).getByRole("heading", { name: "常用银行卡" }),
    ).toBeInTheDocument();
    for (const candidate of bankCandidates) {
      expect(
        within(sheet).getByRole("button", { name: candidate }),
      ).toBeInTheDocument();
    }
  });

  it("点击「×」关闭弹层", () => {
    const { onClose, sheet } = renderSheet();

    fireEvent.click(within(sheet).getByRole("button", { name: "关闭" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("点击候选 Chip 将名称填入输入框并高亮，可以继续编辑", () => {
    const { sheet } = renderSheet();

    clickAccountCandidate(sheet, "楽天銀行");

    expect(getAccountNameInput(sheet)).toHaveValue("楽天銀行");
    expect(
      within(sheet).getByRole("button", { name: "楽天銀行" }),
    ).toHaveAttribute("aria-pressed", "true");

    changeAccountName(sheet, "楽天銀行（家用）");

    expect(getAccountNameInput(sheet)).toHaveValue("楽天銀行（家用）");
    expect(
      within(sheet).getByRole("button", { name: "楽天銀行" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("从候选添加时记录 templateKey", () => {
    const { onAdd, sheet } = renderSheet();

    clickAccountCandidate(sheet, "楽天銀行");
    submitAccountAddSheet(sheet);

    expect(onAdd).toHaveBeenCalledWith({
      name: "楽天銀行",
      templateKey: "楽天銀行",
      type: "bank",
    });
  });

  it("自定义名称不记录 templateKey，并去除首尾空白", () => {
    const { onAdd, sheet } = renderSheet();

    changeAccountName(sheet, "  地方銀行  ");
    submitAccountAddSheet(sheet);

    expect(onAdd).toHaveBeenCalledWith({ name: "地方銀行", type: "bank" });
  });

  it("手动输入与候选一致的名称时也记录 templateKey", () => {
    const { onAdd, sheet } = renderSheet();

    changeAccountName(sheet, "ゆうちょ銀行 ");
    submitAccountAddSheet(sheet);

    expect(onAdd).toHaveBeenCalledWith({
      name: "ゆうちょ銀行",
      templateKey: "ゆうちょ銀行",
      type: "bank",
    });
  });

  it("已添加的候选显示 ✓ 标记，仍可点击", () => {
    const { onAdd, sheet } = renderSheet({
      accounts: [{ name: "楽天銀行", type: "bank" }],
    });

    const addedChip = within(sheet).getByRole("button", {
      name: "楽天銀行 已添加",
    });
    expect(
      within(addedChip).getByTestId("account-candidate-added"),
    ).toBeInTheDocument();
    expect(
      within(
        within(sheet).getByRole("button", { name: "三菱UFJ銀行" }),
      ).queryByTestId("account-candidate-added"),
    ).toBeNull();

    clickAccountCandidate(sheet, "楽天銀行 已添加");

    expect(getAccountNameInput(sheet)).toHaveValue("楽天銀行");
    expect(
      within(sheet).getByText("已有同名账户，请修改名称"),
    ).toBeInTheDocument();
    submitAccountAddSheet(sheet);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("没有候选时不显示常用区域，只能输入名称", () => {
    const { sheet } = renderSheet({ candidates: [] });

    expect(
      within(sheet).queryByRole("heading", { name: "常用银行卡" }),
    ).toBeNull();
    expect(getAccountNameInput(sheet)).toBeInTheDocument();
  });

  it("名称为空时提示并不能添加", () => {
    const { onAdd, sheet } = renderSheet();

    changeAccountName(sheet, "   ");
    submitAccountAddSheet(sheet);

    expect(within(sheet).getByText("请输入名称")).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("名称超过上限时提示并不能添加", () => {
    const { onAdd, sheet } = renderSheet();

    changeAccountName(sheet, "あ".repeat(101));
    submitAccountAddSheet(sheet);

    expect(
      within(sheet).getByText("名称不能超过 100 个字"),
    ).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("同类型内名称重复（忽略大小写）时提示并不能添加", () => {
    const { onAdd, sheet } = renderSheet({
      accounts: [{ name: "Local Bank", type: "bank" }],
    });

    changeAccountName(sheet, "local bank");

    expect(getAccountNameInput(sheet)).toHaveAccessibleDescription(
      "已有同名账户，请修改名称",
    );
    submitAccountAddSheet(sheet);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("其他类型的同名账户不算重复", () => {
    const { onAdd, sheet } = renderSheet({
      accounts: [{ name: "PayPay", type: "e_money" }],
    });

    changeAccountName(sheet, "PayPay");
    submitAccountAddSheet(sheet);

    expect(onAdd).toHaveBeenCalledWith({ name: "PayPay", type: "bank" });
    expect(screen.queryByText("已有同名账户，请修改名称")).toBeNull();
  });
});
