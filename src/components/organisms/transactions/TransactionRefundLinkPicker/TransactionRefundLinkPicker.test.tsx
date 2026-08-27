import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createTransactionListItem } from "@/test/mocks/transactions";

import { TransactionRefundLinkPicker } from "./TransactionRefundLinkPicker";

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

const searchPage = {
  items: [
    createTransactionListItem({
      account_currency: "JPY",
      categoryItems: [
        {
          accountId: "account-1",
          amount: "1200",
          categoryName: "午餐",
          categoryType: "expense",
          id: "refund-item-1",
          parentCategoryName: "饮食",
          refundedAmount: "200",
          remainingRefundableAmount: "1000",
        },
      ],
      merchant_name: "咖啡店",
    }),
  ],
  nextOffset: null,
  totalCount: 1,
};

describe("TransactionRefundLinkPicker", () => {
  it("已关联时提供解除与重新选择入口", () => {
    const onChange = vi.fn();
    render(
      <TransactionRefundLinkPicker
        onChange={onChange}
        value={{
          accountCurrency: "JPY",
          accountId: "account-1",
          amount: "1200",
          categoryName: "午餐",
          id: "refund-item-1",
          parentCategoryName: "饮食",
          refundedAmount: "200",
          remainingRefundableAmount: "1000",
          transactionAt: "2026-08-15T10:00:00.000Z",
          transactionRecordId: "transaction-1",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "解除退款关联" }));
    expect(onChange).toHaveBeenCalledWith(null);
    fireEvent.click(screen.getByRole("button", { name: "重新选择退款明细" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("退款收入超过目标余额时显示完整核销且无未核销净收益", () => {
    const selectedItem = {
      accountCurrency: "JPY",
      accountId: "account-1",
      amount: "1200",
      categoryName: "午餐",
      id: "refund-item-1",
      parentCategoryName: "饮食",
      refundedAmount: "200",
      remainingRefundableAmount: "1000",
      transactionAt: "2026-08-15T10:00:00.000Z",
      transactionRecordId: "transaction-1",
    };

    render(
      <TransactionRefundLinkPicker
        onChange={vi.fn()}
        refundAmount="1500"
        value={selectedItem}
      />,
    );

    expect(screen.getByText("收入子项金额 ¥1,500")).toBeInTheDocument();
    expect(screen.getByText("本次实际核销金额 ¥1,500")).toBeInTheDocument();
    expect(screen.getByText("未核销净收益 ¥0")).toBeInTheDocument();
  });

  it("三位小数币种的关联金额保留币种精度", () => {
    render(
      <TransactionRefundLinkPicker
        onChange={vi.fn()}
        refundAmount="1.111"
        value={{
          accountCurrency: "KWD",
          accountId: "account-1",
          amount: "1.234",
          categoryName: "午餐",
          id: "refund-item-1",
          parentCategoryName: "饮食",
          refundedAmount: "0",
          remainingRefundableAmount: "1.234",
          transactionAt: "2026-08-15T10:00:00.000Z",
          transactionRecordId: "transaction-1",
        }}
      />,
    );

    expect(screen.getByText("午餐 · KWD1.234")).toBeInTheDocument();
    expect(screen.getByText("收入子项金额 KWD1.111")).toBeInTheDocument();
  });

  it("未关联时说明退款不再受剩余可核销额度限制", () => {
    render(<TransactionRefundLinkPicker onChange={vi.fn()} value={null} />);

    expect(
      screen.getByText(
        "退款关联不受剩余可核销额度限制；请选择与收款账户一致的候选支出。",
      ),
    ).toBeInTheDocument();
  });

  it("打开复用的按月浏览与搜索选择模式", () => {
    render(<TransactionRefundLinkPicker onChange={vi.fn()} value={null} />);
    fireEvent.click(screen.getByRole("button", { name: "选择退款明细" }));
    expect(screen.getByRole("tab", { name: "按月浏览" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "搜索" })).toBeInTheDocument();
  });

  it("父组件重新渲染后保留搜索结果并可选择单条退款明细", async () => {
    const loadSearchPageAction = vi.fn(async () => searchPage);
    const onChange = vi.fn();
    const { rerender } = render(
      <TransactionRefundLinkPicker
        loadSearchPageAction={loadSearchPageAction}
        onChange={onChange}
        refundAmount="1000"
        value={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "选择退款明细" }));
    fireEvent.click(screen.getByRole("tab", { name: "搜索" }));
    const input = screen.getByLabelText("搜索关键词");
    fireEvent.change(input, { target: { value: "咖啡" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(loadSearchPageAction).toHaveBeenCalledWith("咖啡", 0);
      expect(
        screen.getByRole("button", { name: "选择退款明细 午餐" }),
      ).toBeInTheDocument();
    });

    rerender(
      <TransactionRefundLinkPicker
        loadSearchPageAction={loadSearchPageAction}
        onChange={onChange}
        refundAmount="1000"
        value={null}
      />,
    );

    expect(screen.getByLabelText("搜索关键词")).toHaveValue("咖啡");
    fireEvent.click(screen.getByRole("button", { name: "选择退款明细 午餐" }));
    fireEvent.click(screen.getByRole("button", { name: "完成" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "refund-item-1",
        remainingRefundableAmount: "1000",
      }),
    );
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("清空关键词及重新进入搜索导航时恢复搜索引导", async () => {
    const loadSearchPageAction = vi.fn(async () => searchPage);
    render(
      <TransactionRefundLinkPicker
        loadSearchPageAction={loadSearchPageAction}
        onChange={vi.fn()}
        value={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "选择退款明细" }));
    fireEvent.click(screen.getByRole("tab", { name: "搜索" }));
    const input = screen.getByLabelText("搜索关键词");
    fireEvent.change(input, { target: { value: "咖啡" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    await screen.findByRole("button", { name: "选择退款明细 午餐" });

    fireEvent.click(screen.getByRole("button", { name: "清除搜索词" }));
    expect(screen.getByText("输入关键词，快速查找流水")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("搜索关键词"), {
      target: { value: "午餐" },
    });
    fireEvent.submit(
      screen.getByLabelText("搜索关键词").closest("form") as HTMLFormElement,
    );
    await screen.findByRole("button", { name: "选择退款明细 午餐" });
    fireEvent.click(screen.getByRole("tab", { name: "按月浏览" }));
    fireEvent.click(screen.getByRole("tab", { name: "搜索" }));

    expect(screen.getByLabelText("搜索关键词")).toHaveValue("");
    expect(screen.getByText("输入关键词，快速查找流水")).toBeInTheDocument();
  });

  it("搜索读取失败后只重试当前搜索请求", async () => {
    const loadSearchPageAction = vi
      .fn()
      .mockRejectedValueOnce(new Error("failed"))
      .mockResolvedValueOnce(searchPage);
    render(
      <TransactionRefundLinkPicker
        loadSearchPageAction={loadSearchPageAction}
        onChange={vi.fn()}
        value={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "选择退款明细" }));
    fireEvent.click(screen.getByRole("tab", { name: "搜索" }));
    const input = screen.getByLabelText("搜索关键词");
    fireEvent.change(input, { target: { value: "7930" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    expect(
      await screen.findByText("搜索结果读取失败，请稍后重新读取。"),
    ).toBeInTheDocument();
    expect(screen.getByText("搜索读取失败")).toBeInTheDocument();
    expect(loadSearchPageAction).toHaveBeenCalledWith("7930", 0);

    fireEvent.click(screen.getByRole("button", { name: "重新读取" }));

    expect(
      await screen.findByRole("button", { name: "选择退款明细 午餐" }),
    ).toBeInTheDocument();
    expect(loadSearchPageAction).toHaveBeenNthCalledWith(2, "7930", 0);
  });
});
