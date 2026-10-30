import { screen, within, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createEntryCallbacks,
  renderEntryComponent,
  clickEntryButton as click,
  selectEntryAccount as selectAccount,
} from "test/transactionStepFlow";
import {
  flowFixture,
  accountStepFixture,
} from "test/mocks/transactionStepFlow";
import { AccountStep } from "./AccountStep";
import type { AccountStepProps } from "./AccountStep.types";

function setup(overrides: Partial<AccountStepProps> = {}) {
  const callbacks = createEntryCallbacks();
  const props = {
    ...accountStepFixture,
    onSelect: callbacks.onAccountSelect,
    onAddAccount: callbacks.onAddAccount,
    ...overrides,
  };
  const view = renderEntryComponent(<AccountStep {...props} />);
  return { ...view, props };
}
function currencySetup(hasDetails = true) {
  return setup({ selectedAccount: flowFixture.accounts[1], hasDetails });
}
describe("AccountStep", () => {
  it("推荐账户按传入顺序显示且不重复截取，其他账户按原顺序", () => {
    setup({ recommendedAccountIds: ["paypay", "cash", "cny", "bank"] });
    expect(screen.getByText("按这家商家最近 20 笔记录")).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("radio")
        .map((item) => item.getAttribute("aria-label")),
    ).toEqual(["PayPay JPY", "现金 JPY", "招商银行卡 CNY", "乐天银行 JPY"]);
    expect(screen.queryByText("其他账户")).not.toBeInTheDocument();
  });
  it("推荐账户之外的账户按原顺序显示", () => {
    setup({ recommendedAccountIds: ["cny"] });
    expect(screen.getByText("其他账户")).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("radio")
        .map((item) => item.getAttribute("aria-label")),
    ).toEqual(["招商银行卡 CNY", "现金 JPY", "PayPay JPY", "乐天银行 JPY"]);
  });
  it("没有推荐时显示提示并保留账户顺序", () => {
    setup({ recommendedAccountIds: [] });
    expect(screen.queryByText("推荐账户")).not.toBeInTheDocument();
    expect(
      screen.getByText("这家商家还没有记录，按账户顺序显示"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")[0]).toHaveAttribute(
      "aria-label",
      "现金 JPY",
    );
  });
  it("没有账户时显示新增入口", () => {
    const { props } = setup({ accounts: [] });
    click("新增账户");
    expect(props.onAddAccount).toHaveBeenCalledOnce();
  });
  it("不传新增回调时没有账户也不显示新增入口（编辑记账）", () => {
    setup({ accounts: [], onAddAccount: undefined });
    expect(screen.getByText("还没有收支账户")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  it("显示已有账户的成员和占位持有人名称，兼容旧调用未传持有人", () => {
    setup({
      accounts: [
        {
          ...flowFixture.accounts[0],
          holders: [{ display_name: "我" }, { display_name: "妻子" }],
        },
        { ...flowFixture.accounts[1], holders: [{ display_name: "奶奶" }] },
        { ...flowFixture.accounts[2], holders: [] },
        { ...flowFixture.accounts[3], holders: undefined },
      ],
    });
    expect(
      within(screen.getByRole("radio", { name: "现金 JPY" })).getByText(
        "持有人：我、妻子",
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("radio", { name: "PayPay JPY" })).getByText(
        "持有人：奶奶",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("持有人：未指定")).toHaveLength(2);
  });
  it("单选账户时通知外部，并按传入的选中账户展示", async () => {
    const { props, rerender } = setup();
    selectAccount();
    await waitFor(() =>
      expect(props.onSelect).toHaveBeenCalledWith(flowFixture.accounts[1]),
    );
    rerender(
      <AccountStep {...props} selectedAccount={flowFixture.accounts[1]} />,
    );
    expect(screen.getByRole("radio", { name: "PayPay JPY" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
  it("已有明细时换币种取消不切换，确认后才通知外部", async () => {
    const { props } = currencySetup();
    selectAccount("招商银行卡 CNY");
    expect(
      screen.getByText(
        "币种将从 JPY 变为 CNY，已填写的金额不会换算，数字保持不变。已关联的退款 / 报销会被取消。",
      ),
    ).toBeInTheDocument();
    expect(props.onSelect).not.toHaveBeenCalled();
    click("取消");
    await waitFor(() =>
      expect(
        screen.queryByText("切换为 招商银行卡 账户？"),
      ).not.toBeInTheDocument(),
    );
    expect(props.onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "PayPay JPY" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    selectAccount("招商银行卡 CNY");
    click("切换");
    await waitFor(() =>
      expect(props.onSelect).toHaveBeenCalledWith(flowFixture.accounts[2]),
    );
  });
  it("没有明细时换币种无需确认", async () => {
    const { props } = currencySetup(false);
    selectAccount("招商银行卡 CNY");
    await waitFor(() =>
      expect(props.onSelect).toHaveBeenCalledWith(flowFixture.accounts[2]),
    );
    expect(
      screen.queryByText("切换为 招商银行卡 账户？"),
    ).not.toBeInTheDocument();
  });
});
