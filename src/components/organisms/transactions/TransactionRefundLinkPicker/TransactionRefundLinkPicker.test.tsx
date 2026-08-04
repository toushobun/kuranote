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
  it("打开复用的按月浏览与搜索选择模式", () => {
    render(<TransactionRefundLinkPicker onChange={vi.fn()} value={null} />);
    fireEvent.click(screen.getByRole("button", { name: "选择退款明细" }));
    expect(screen.getByRole("tab", { name: "按月浏览" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "搜索" })).toBeInTheDocument();
  });

  it("父组件重新渲染后保留搜索结果并可选择退款明细", async () => {
    const loadSearchPageAction = vi.fn(async () => searchPage);
    const onChange = vi.fn();
    const { rerender } = render(
      <TransactionRefundLinkPicker
        loadSearchPageAction={loadSearchPageAction}
        onChange={onChange}
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
        value={null}
      />,
    );

    expect(screen.getByLabelText("搜索关键词")).toHaveValue("咖啡");
    fireEvent.click(screen.getByRole("button", { name: "选择退款明细 午餐" }));
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
});
