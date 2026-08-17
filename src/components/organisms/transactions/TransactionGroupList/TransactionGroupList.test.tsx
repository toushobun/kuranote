import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTransactionDateGroup,
  createTransactionListItem,
} from "@/test/mocks/transactions";
import type { TransactionRowProps } from "molecules/transactions/TransactionRow";

import {
  TransactionGroupList,
  TransactionRefundCandidateList,
} from "./TransactionGroupList";

const stableDateLabelTestTime = new Date("2026-06-20T03:00:00.000Z");

vi.mock("molecules/transactions/TransactionRow", () => ({
  TransactionRow: ({ item }: TransactionRowProps): ReactNode => (
    <div data-testid={`row-${item.id}`}>
      {item.merchant_name ?? "未指定商家"}
    </div>
  ),
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(stableDateLabelTestTime);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const defaultGroup = createTransactionDateGroup({
  date: "2026-06-05",
  label: "5日（周五）",
});

describe("TransactionGroupList", () => {
  it("显示分组日期标签", () => {
    const { container } = render(
      <TransactionGroupList groups={[defaultGroup]} />,
    );

    expect(within(container).getByText("5日（周五）")).toBeInTheDocument();
  });

  it("显示分组内的记账记录", () => {
    const { container } = render(
      <TransactionGroupList groups={[defaultGroup]} />,
    );

    expect(
      within(container).getByTestId("row-00000000-0000-4000-8000-000000009001"),
    ).toBeInTheDocument();
  });

  it("记账记录本身直接链接到编辑页且不显示编辑按钮", () => {
    const { container } = render(
      <TransactionGroupList groups={[defaultGroup]} />,
    );

    expect(
      within(container).getByRole("link", { name: "便利店" }),
    ).toHaveAttribute(
      "href",
      "/transactions/00000000-0000-4000-8000-000000009001/edit",
    );
    expect(within(container).queryByRole("link", { name: "编辑" })).toBeNull();
    expect(
      within(container).queryByRole("button", { name: "删除" }),
    ).toBeNull();
  });

  it("显示多个分组", () => {
    const group2 = createTransactionDateGroup({
      date: "2026-06-01",
      label: "1日（周一）",
    });
    const { container } = render(
      <TransactionGroupList groups={[defaultGroup, group2]} />,
    );

    expect(within(container).getByText("5日（周五）")).toBeInTheDocument();
    expect(within(container).getByText("1日（周一）")).toBeInTheDocument();
  });

  it("跨过本地 0 点后自动重新计算相对日期标签", () => {
    vi.setSystemTime(new Date("2026-07-01T14:50:00.000Z"));

    render(
      <TransactionGroupList
        groups={[
          createTransactionDateGroup({
            date: "2026-07-01",
            label: "1日（旧标签）",
          }),
          createTransactionDateGroup({
            date: "2026-07-02",
            label: "2日（旧标签）",
          }),
        ]}
      />,
    );

    expect(screen.getByText("1日（今天）")).toBeInTheDocument();
    expect(screen.getByText("2日（明天）")).toBeInTheDocument();
    expect(screen.queryByText("1日（旧标签）")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000);
    });

    expect(screen.getByText("1日（昨天）")).toBeInTheDocument();
    expect(screen.getByText("2日（今天）")).toBeInTheDocument();
  });

  it("显示分组支出汇总", () => {
    const { container } = render(
      <TransactionGroupList groups={[defaultGroup]} />,
    );

    expect(within(container).getByText("支出 ¥1,234")).toBeInTheDocument();
  });

  it("同一分组同时有收入和支出时显示收支与合计", () => {
    const mixedGroup = createTransactionDateGroup({
      items: [
        createTransactionListItem({
          amount: "3130",
          id: "00000000-0000-4000-8000-000000009002",
          type: "expense",
        }),
        createTransactionListItem({
          amount: "260000",
          categoryItems: [
            {
              amount: "260000",
              categoryName: "工资",
              parentCategoryName: "固定收入",
            },
          ],
          id: "00000000-0000-4000-8000-000000009003",
          merchant_name: "株式会社共达",
          type: "income",
        }),
      ],
    });
    const { container } = render(
      <TransactionGroupList groups={[mixedGroup]} />,
    );

    expect(
      within(container).getByText(
        "收入 ¥260,000 / 支出 ¥3,130 / 合计 +¥256,870",
      ),
    ).toBeInTheDocument();
  });

  it("报销选择模式使用单选并透传剩余可核销金额", () => {
    const onSelectReimbursementItem = vi.fn();
    const reimbursementGroup = createTransactionDateGroup({
      items: [
        createTransactionListItem({
          account_currency: "USD",
          amount: "100",
          categoryItems: [
            {
              accountId: "account-1",
              amount: "100",
              categoryName: "服装",
              categoryType: "expense",
              id: "reimbursement-item-1",
              parentCategoryName: "购物",
              refundedAmount: "40",
              remainingRefundableAmount: "60",
            },
          ],
        }),
      ],
    });

    render(
      <TransactionGroupList
        groups={[reimbursementGroup]}
        onSelectReimbursementItem={onSelectReimbursementItem}
        reimbursementSelectionMode
        selectedReimbursementItemId="reimbursement-item-1"
      />,
    );

    expect(screen.getByText("剩余可核销 $60")).toBeInTheDocument();
    expect(screen.getByRole("radio")).toBeChecked();
    const button = screen.getByRole("button", {
      name: "选择报销明细 服装",
    });
    expect(button).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(button);
    expect(onSelectReimbursementItem).toHaveBeenCalledWith(
      expect.objectContaining({
        accountCurrency: "USD",
        id: "reimbursement-item-1",
        remainingRefundableAmount: "60",
      }),
    );
  });
});

describe("TransactionRefundCandidateList", () => {
  function createRefundRecord(
    refundedAmount: string,
    remainingRefundableAmount: string,
  ) {
    return createTransactionListItem({
      account_currency: "USD",
      amount: "100",
      categoryItems: [
        {
          accountId: "account-1",
          amount: "100",
          categoryName: "服装",
          categoryType: "expense",
          id: "refund-item-1",
          parentCategoryName: "购物",
          refundedAmount,
          remainingRefundableAmount,
        },
      ],
    });
  }

  it("显示部分退款金额并允许选择", () => {
    const onSelect = vi.fn();

    render(
      <TransactionRefundCandidateList
        items={[createRefundRecord("40", "60")]}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText("原始金额 $100")).toBeInTheDocument();
    expect(screen.getByText("剩余可退 $60")).toBeInTheDocument();
    expect(screen.getByText("已退款 $40")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "选择退款明细 服装" }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        accountCurrency: "USD",
        id: "refund-item-1",
        remainingRefundableAmount: "60",
      }),
    );
  });

  it("刚好退完时禁用选择", () => {
    const onSelect = vi.fn();

    render(
      <TransactionRefundCandidateList
        items={[createRefundRecord("100", "0")]}
        onSelect={onSelect}
      />,
    );

    const button = screen.getByRole("button", {
      name: "选择退款明细 服装",
    });
    expect(button).toBeDisabled();
    expect(screen.getByText("剩余可退 $0")).toBeInTheDocument();
    expect(screen.getByText("已退款 $100")).toBeInTheDocument();

    fireEvent.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
