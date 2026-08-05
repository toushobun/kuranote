import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { screen, userEvent, within } from "storybook/test";

import { createTransactionListItem } from "@/test/mocks/transactions";

import { TransactionRefundLinkPicker } from "./TransactionRefundLinkPicker";

const meta = {
  title: "Organisms/Transactions/TransactionRefundLinkPicker",
  component: TransactionRefundLinkPicker,
  args: { onChange() {}, value: null },
} satisfies Meta<typeof TransactionRefundLinkPicker>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

function SimulatedSafeArea({ children }: { children: ReactNode }) {
  useEffect(() => {
    const rootStyle = document.documentElement.style;
    const previousTop = rootStyle.getPropertyValue("--app-safe-area-inset-top");
    const previousBottom = rootStyle.getPropertyValue(
      "--app-safe-area-inset-bottom",
    );

    rootStyle.setProperty("--app-safe-area-inset-top", "3rem");
    rootStyle.setProperty("--app-safe-area-inset-bottom", "1.5rem");

    return () => {
      if (previousTop) {
        rootStyle.setProperty("--app-safe-area-inset-top", previousTop);
      } else {
        rootStyle.removeProperty("--app-safe-area-inset-top");
      }
      if (previousBottom) {
        rootStyle.setProperty("--app-safe-area-inset-bottom", previousBottom);
      } else {
        rootStyle.removeProperty("--app-safe-area-inset-bottom");
      }
    };
  }, []);

  return children;
}

export const FullScreenSafeArea: Story = {
  name: "全屏弹框安全区",
  decorators: [
    (Story) => (
      <SimulatedSafeArea>
        <Story />
      </SimulatedSafeArea>
    ),
  ],
  parameters: {
    viewport: { defaultViewport: "mobile2" },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "选择退款明细" }),
    );
    await screen.findByRole("button", { name: "关闭退款关联选择器" });
  },
};

const refundSearchPage = {
  items: [
    createTransactionListItem({
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

export const SearchResults: Story = {
  name: "搜索结果",
  args: {
    loadSearchPageAction: async () => refundSearchPage,
  },
  parameters: {
    viewport: { defaultViewport: "mobile2" },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "选择退款明细" }),
    );
    await userEvent.click(await screen.findByRole("tab", { name: "搜索" }));
    await userEvent.type(screen.getByLabelText("搜索关键词"), "咖啡{Enter}");
    await screen.findByRole("button", { name: "选择退款明细 午餐" });
  },
};

export const EmptySearchResults: Story = {
  name: "搜索无结果",
  args: {
    loadSearchPageAction: async () => ({
      items: [],
      nextOffset: null,
      totalCount: 0,
    }),
  },
  parameters: {
    viewport: { defaultViewport: "mobile2" },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "选择退款明细" }),
    );
    await userEvent.click(await screen.findByRole("tab", { name: "搜索" }));
    await userEvent.type(screen.getByLabelText("搜索关键词"), "不存在{Enter}");
    await screen.findByText("没有找到相关流水");
  },
};

export const SearchError: Story = {
  name: "搜索读取失败",
  args: {
    loadSearchPageAction: async () => {
      throw new Error("storybook search failure");
    },
  },
  parameters: {
    viewport: { defaultViewport: "mobile2" },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "选择退款明细" }),
    );
    await userEvent.click(await screen.findByRole("tab", { name: "搜索" }));
    await userEvent.type(screen.getByLabelText("搜索关键词"), "7930{Enter}");
    await screen.findByText("搜索结果读取失败，请稍后重新读取。");
  },
};
