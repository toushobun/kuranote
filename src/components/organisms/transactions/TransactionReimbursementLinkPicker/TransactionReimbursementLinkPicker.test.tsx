import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createTransactionListItem } from "@/test/mocks/transactions";

import { TransactionReimbursementLinkPicker } from "./TransactionReimbursementLinkPicker";

type NextImageMockProps = {
  alt: string;
  fill?: boolean;
};

vi.mock("next/image", () => ({
  default: ({ alt, fill }: NextImageMockProps) => (
    <span aria-label={alt} data-fill={fill ? "true" : undefined} />
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("theme/UserThemeProvider", () => ({
  useUserTheme: () => ({ themeKey: "amberWarmth" }),
}));

const candidates = [
  {
    accountCurrency: "JPY",
    accountId: "expense-account-1",
    amount: "1200",
    categoryName: "午餐",
    id: "reimbursement-item-1",
    parentCategoryName: "饮食",
    refundedAmount: "200",
    remainingRefundableAmount: "1000",
    transactionAt: "2026-08-15T10:00:00.000Z",
    transactionRecordId: "transaction-1",
  },
  {
    accountCurrency: "JPY",
    accountId: "expense-account-2",
    amount: "900",
    categoryName: "晚餐",
    id: "reimbursement-item-2",
    parentCategoryName: "饮食",
    refundedAmount: "0",
    remainingRefundableAmount: "600",
    transactionAt: "2026-08-16T10:00:00.000Z",
    transactionRecordId: "transaction-2",
  },
];

const searchPage = {
  items: candidates.map((candidate) =>
    createTransactionListItem({
      account_currency: candidate.accountCurrency,
      categoryItems: [
        {
          accountId: candidate.accountId,
          amount: candidate.amount,
          categoryName: candidate.categoryName,
          categoryType: "expense",
          id: candidate.id,
          parentCategoryName: candidate.parentCategoryName,
          refundedAmount: candidate.refundedAmount,
          remainingRefundableAmount: candidate.remainingRefundableAmount,
        },
      ],
    }),
  ),
  nextOffset: null,
  totalCount: 2,
};

describe("TransactionReimbursementLinkPicker", () => {
  it("显示收入金额、实际核销金额与未核销净收益", () => {
    render(
      <TransactionReimbursementLinkPicker
        incomeAmount="1500"
        onChange={vi.fn()}
        value={candidates[0]}
      />,
    );

    expect(screen.getByText("收入子项金额 ¥1,500")).toBeInTheDocument();
    expect(screen.getByText("本次实际核销金额 ¥1,000")).toBeInTheDocument();
    expect(screen.getByText("未核销净收益 ¥500")).toBeInTheDocument();
  });

  it("搜索候选使用单选，后选项覆盖前选项", async () => {
    const loadSearchPageAction = vi.fn(async () => searchPage);
    const onChange = vi.fn();
    render(
      <TransactionReimbursementLinkPicker
        incomeAmount="1000"
        loadSearchPageAction={loadSearchPageAction}
        onChange={onChange}
        value={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "选择报销明细" }));
    fireEvent.click(screen.getByRole("tab", { name: "搜索" }));
    const input = screen.getByLabelText("搜索关键词");
    fireEvent.change(input, { target: { value: "饮食" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(loadSearchPageAction).toHaveBeenCalledWith("饮食", 0);
    });

    const firstButton = await screen.findByRole("button", {
      name: "选择报销明细 午餐",
    });
    const secondButton = screen.getByRole("button", {
      name: "选择报销明细 晚餐",
    });

    fireEvent.click(firstButton);
    expect(firstButton).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(secondButton);
    expect(firstButton).toHaveAttribute("aria-pressed", "false");
    expect(secondButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "完成（2）" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "完成" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: "reimbursement-item-2" }),
    );
  });
});
