import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UserThemeProvider } from "theme/UserThemeProvider";
import type { TransactionListItem } from "types/transactions";

import { TransactionSearchTemplate } from "./TransactionSearch";

const searchItems: TransactionListItem[] = [
  createStoryItem({
    amount: "980",
    idSuffix: "970001",
    merchantName: "便利店",
    note: "午餐和饮料",
    recorderName: "我",
  }),
  createStoryItem({
    amount: "1280",
    idSuffix: "970002",
    merchantName: "咖啡店",
    note: "周末咖啡",
    recorderName: "妻",
  }),
];

const longTextItem = createStoryItem({
  amount: "8754",
  idSuffix: "970003",
  merchantName: "超级长名字的星巴克海洋馆旁边分店测试是否正常省略",
  note: "这是一条比较长的备注，用来确认搜索结果列表在长文本场景下仍然保持移动端布局稳定。",
  recorderName: "家庭成员名字也很长",
});

const meta = {
  title: "Templates/Transactions/TransactionSearchTemplate",
  component: TransactionSearchTemplate,
  decorators: [
    (Story) => (
      <UserThemeProvider storageScope="storybook-transaction-search">
        <Story />
      </UserThemeProvider>
    ),
  ],
  args: {
    errorMessage: null,
    initialPage: {
      items: searchItems,
      nextOffset: null,
      totalCount: searchItems.length,
    },
    initialQuery: "便利店",
    isLoading: false,
  },
} satisfies Meta<typeof TransactionSearchTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "搜索结果",
};

export const EmptyKeyword: Story = {
  name: "未输入关键词",
  args: {
    initialPage: {
      items: [],
      nextOffset: null,
      totalCount: 0,
    },
    initialQuery: "",
  },
};

export const NoResults: Story = {
  name: "无搜索结果",
  args: {
    initialPage: {
      items: [],
      nextOffset: null,
      totalCount: 0,
    },
    initialQuery: "不存在的商家",
  },
};

export const Loading: Story = {
  name: "加载中",
  args: {
    isLoading: true,
  },
};

export const WithError: Story = {
  name: "搜索读取失败",
  args: {
    errorMessage: "搜索结果读取失败，请稍后重新读取。",
  },
};

export const LongKeywordAndMerchant: Story = {
  name: "长关键词和长商家名",
  args: {
    initialPage: {
      items: [longTextItem],
      nextOffset: null,
      totalCount: 1,
    },
    initialQuery: "超级长名字的星巴克海洋馆旁边分店 8754 家庭成员名字也很长",
  },
};

function createStoryItem({
  amount,
  idSuffix,
  merchantName,
  note,
  recorderName,
}: {
  amount: string;
  idSuffix: string;
  merchantName: string;
  note: string;
  recorderName: string;
}): TransactionListItem {
  const time = "2026-07-01T10:00:00.000Z";

  return {
    account_currency: "JPY",
    account_name: "三井住友银行",
    amount,
    categoryItems: [
      {
        amount,
        categoryName: "午餐",
        categoryType: "expense",
        parentCategoryName: "饮食",
      },
    ],
    created_at: time,
    id: `00000000-0000-4000-8000-${idSuffix.padStart(12, "0")}`,
    merchant_icon_url: null,
    merchant_name: merchantName,
    note,
    recorder_name: recorderName,
    tagNames: ["日常"],
    transaction_at: time,
    type: "expense",
  };
}
