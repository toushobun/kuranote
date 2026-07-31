import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { Account } from "types/accounts";

import { AccountSummaryCard } from "./AccountSummaryCard";

const accounts: Account[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "三菱UFJ银行",
    type: "bank",
    currency: "JPY",
    initial_balance: 100000,
    current_balance: 85000,
    sort_order: 1,
    created_at: "2026-01-01T00:00:00.000Z",
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
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "PayPay",
    type: "e_money",
    currency: "JPY",
    initial_balance: 0,
    current_balance: 3200,
    sort_order: 2,
    created_at: "2026-01-02T00:00:00.000Z",
    holders: [],
  },
];

const meta: Meta<typeof AccountSummaryCard> = {
  component: AccountSummaryCard,
  title: "Organisms/Accounts/AccountSummaryCard",
};

export default meta;
type Story = StoryObj<typeof AccountSummaryCard>;

export const Default: Story = {
  name: "账户总览",
  args: {
    accounts,
    baseCurrency: "JPY",
  },
};

export const Empty: Story = {
  name: "无账户",
  args: {
    accounts: [],
    baseCurrency: "JPY",
  },
};

export const NegativeTotal: Story = {
  name: "总余额为负（信用卡为主）",
  args: {
    baseCurrency: "JPY",
    accounts: [
      {
        id: "00000000-0000-4000-8000-000000000001",
        name: "楽天カード",
        type: "credit_card",
        currency: "JPY",
        initial_balance: 0,
        current_balance: -120000,
        sort_order: 1,
        created_at: "2026-01-01T00:00:00.000Z",
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
      {
        id: "00000000-0000-4000-8000-000000000002",
        name: "PayPay",
        type: "e_money",
        currency: "JPY",
        initial_balance: 0,
        current_balance: 3200,
        sort_order: 2,
        created_at: "2026-01-02T00:00:00.000Z",
        holders: [],
      },
    ],
  },
};

export const WithForeignCurrencyAccount: Story = {
  name: "存在外币账户",
  args: {
    baseCurrency: "JPY",
    accounts: [
      ...accounts,
      {
        id: "00000000-0000-4000-8000-000000000003",
        name: "美元账户",
        type: "bank",
        currency: "USD",
        initial_balance: 0,
        current_balance: 500,
        sort_order: 3,
        created_at: "2026-01-03T00:00:00.000Z",
        holders: [],
      },
    ],
  },
};

export const MultipleHolders: Story = {
  name: "多位持有人",
  args: {
    baseCurrency: "JPY",
    accounts: [
      {
        ...accounts[0],
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
      accounts[1],
    ],
  },
};
