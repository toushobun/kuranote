import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AccountCard } from "./AccountCard";

const meta: Meta<typeof AccountCard> = {
  component: AccountCard,
  title: "Molecules/Accounts/AccountCard",
};

export default meta;
type Story = StoryObj<typeof AccountCard>;

export const BankAccount: Story = {
  name: "银行卡",
  args: {
    name: "三菱UFJ银行",
    type: "bank",
    currency: "JPY",
    currentBalance: 85000,
    holders: [
      {
        id: "holder-1",
        user_id: "user-1",
        display_name: "本地开发用户",
        email: "local1@example.test",
        display_color: "sky",
        role: "owner",
        share_ratio: null,
      },
    ],
  },
};

export const SharedCashAccount: Story = {
  name: "共同持有现金账户",
  args: {
    name: "日元现金",
    type: "cash",
    currency: "JPY",
    currentBalance: 4560,
    holders: [
      {
        id: "holder-1",
        user_id: "user-1",
        display_name: "本地开发用户",
        email: "local1@example.test",
        display_color: "sky",
        role: "co_owner",
        share_ratio: null,
      },
      {
        id: "holder-2",
        user_id: "user-2",
        display_name: "本地开发用户2",
        email: "local2@example.test",
        display_color: "sakura",
        role: "co_owner",
        share_ratio: null,
      },
    ],
  },
};

export const AccountWithoutHolder: Story = {
  name: "未设置持有人",
  args: {
    name: "未分类账户",
    type: "other",
    currency: "JPY",
    currentBalance: 0,
    holders: [],
  },
};

export const CreditCard: Story = {
  name: "信用卡",
  args: {
    name: "楽天カード",
    type: "credit_card",
    currency: "JPY",
    currentBalance: -12500,
    holders: [
      {
        id: "holder-3",
        user_id: "user-1",
        display_name: "本地开发用户",
        email: "local1@example.test",
        display_color: "sky",
        role: "owner",
        share_ratio: null,
      },
    ],
  },
};

export const EMoney: Story = {
  name: "电子钱包",
  args: {
    name: "PayPay",
    type: "e_money",
    currency: "JPY",
    currentBalance: 3200,
    holders: [
      {
        id: "holder-4",
        user_id: "user-2",
        display_name: "本地开发用户2",
        email: "local2@example.test",
        display_color: "sakura",
        role: "owner",
        share_ratio: null,
      },
    ],
  },
};

export const OtherType: Story = {
  name: "其他类型账户",
  args: {
    name: "备用账户",
    type: "other",
    currency: "CNY",
    currentBalance: 500,
    holders: [
      {
        id: "holder-5",
        user_id: "user-1",
        display_name: "本地开发用户",
        email: "local1@example.test",
        display_color: "sky",
        role: "owner",
        share_ratio: null,
      },
    ],
  },
};

export const ForeignCurrency: Story = {
  name: "外币账户",
  args: {
    name: "美元储蓄",
    type: "bank",
    currency: "USD",
    currentBalance: 12800,
    holders: [
      {
        id: "holder-1",
        user_id: "user-1",
        display_name: "本地开发用户",
        email: "local1@example.test",
        display_color: "sky",
        role: "owner",
        share_ratio: null,
      },
    ],
  },
};

export const NegativeBalance: Story = {
  name: "负余额（信用卡欠款）",
  args: {
    name: "招商银行信用卡",
    type: "credit_card",
    currency: "CNY",
    currentBalance: -8600,
    holders: [
      {
        id: "holder-1",
        user_id: "user-1",
        display_name: "本地开发用户",
        email: "local1@example.test",
        display_color: "sky",
        role: "owner",
        share_ratio: null,
      },
    ],
  },
};

export const Clickable: Story = {
  name: "可点击卡片",
  args: {
    name: "三菱UFJ银行",
    type: "bank",
    currency: "JPY",
    currentBalance: 85000,
    holders: [
      {
        id: "holder-1",
        user_id: "user-1",
        display_name: "本地开发用户",
        email: "local1@example.test",
        display_color: "sky",
        role: "owner",
        share_ratio: null,
      },
    ],
    onClick: () => {},
  },
};
