import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  TransactionSearchPage,
  TransactionTimeGroupViewData,
} from "types/transactions";
import { TransactionLinkCandidatePanel } from "./TransactionLinkCandidatePanel";

const emptyView: TransactionTimeGroupViewData = {
  groupBy: "month",
  groups: [],
  initialDateGroupsByGroupId: {},
  initialExpandedGroupId: null,
  initialNextItemOffsetByGroupId: {},
  nextOffset: null,
};

const matchingRecord: TransactionSearchPage["items"][number] = {
  id: "record-1",
  type: "expense",
  transaction_at: "2026-11-05T12:00:00Z",
  created_at: "2026-11-05T12:00:00Z",
  amount: "1000",
  account_name: "现金",
  account_currency: "JPY",
  categoryItems: [
    {
      amount: "1000",
      categoryName: "餐饮",
      categoryType: "expense",
      id: "item-1",
      parentCategoryName: "生活",
      refundedAmount: "250",
      remainingRefundableAmount: "750",
    },
  ],
  merchant_name: "便利店",
  merchant_icon_url: null,
  note: null,
  recorder_name: null,
};
describe("TransactionLinkCandidatePanel", () => {
  afterEach(() => cleanup());

  it("退款先按当前商家浏览，无候选时退回全部商家", async () => {
    const loadInitial = vi
      .fn()
      .mockResolvedValueOnce(emptyView)
      .mockResolvedValueOnce(emptyView);
    render(
      <TransactionLinkCandidatePanel
        amount=""
        kind="refund"
        merchantId="current-merchant"
        loadInitialViewAction={loadInitial}
        onAmountChange={vi.fn()}
        onChange={vi.fn()}
        value={null}
      />,
    );
    await waitFor(() => expect(loadInitial).toHaveBeenCalledTimes(2));
    expect(loadInitial).toHaveBeenNthCalledWith(1, "current-merchant");
    expect(loadInitial).toHaveBeenNthCalledWith(2, undefined);
  });

  it("搜索不携带商家条件，选择候选后通过回调提交", async () => {
    const onChange = vi.fn();
    const loadSearch = vi.fn().mockResolvedValue({
      items: [matchingRecord],
      nextOffset: null,
      totalCount: 1,
    });
    render(
      <TransactionLinkCandidatePanel
        amount=""
        kind="refund"
        merchantId="current-merchant"
        loadSearchPageAction={loadSearch}
        onAmountChange={vi.fn()}
        onChange={onChange}
        value={null}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "搜索原支出" }), {
      target: { value: "便利店" },
    });
    await waitFor(() => expect(loadSearch).toHaveBeenCalledWith("便利店", 0));
    fireEvent.click(
      await screen.findByRole("button", { name: "选择退款明细 餐饮" }),
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "item-1",
        remainingRefundableAmount: "750",
      }),
    );
  });

  it("选中原支出以后允许输入本次金额", () => {
    const onAmountChange = vi.fn();
    render(
      <TransactionLinkCandidatePanel
        amount="500"
        kind="reimbursement"
        onAmountChange={onAmountChange}
        onChange={vi.fn()}
        value={{
          id: "item-1",
          accountCurrency: "JPY",
          amount: "1000",
          categoryName: "餐饮",
          parentCategoryName: "生活",
          refundedAmount: "0",
          remainingRefundableAmount: "750",
          transactionAt: "2026-11-05T12:00:00Z",
          transactionRecordId: "record-1",
        }}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "核销金额" }), {
      target: { value: "300" },
    });
    expect(onAmountChange).toHaveBeenCalledWith("300");
  });
});
