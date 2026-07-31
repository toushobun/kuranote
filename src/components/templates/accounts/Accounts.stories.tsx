import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UserThemeProvider } from "theme/UserThemeProvider";
import type { AccountHolderOption, Account } from "types/accounts";

import { AccountsTemplate } from "./Accounts";

const holderOptions: AccountHolderOption[] = [
  {
    user_id: "user-1",
    display_name: "本地开发用户",
    email: "local1@example.test",
  },
];

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

const meta = {
  title: "Templates/Accounts/AccountsTemplate",
  component: AccountsTemplate,
  decorators: [
    (Story) => (
      <UserThemeProvider storageScope="storybook-accounts-template">
        <Story />
      </UserThemeProvider>
    ),
  ],
  args: {
    accounts,
    archiveAccountAction: async () => ({}),
    baseCurrency: "JPY",
    createAccountAction: async () => ({}),
    holderOptions,
    ledgerName: "家庭账本",
    updateAccountAction: async () => ({}),
  },
} satisfies Meta<typeof AccountsTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "账户页面",
};

export const Empty: Story = {
  name: "无账户",
  args: {
    accounts: [],
  },
};

export const WithError: Story = {
  name: "错误反馈弹窗",
  args: {
    initialErrorKey: "story-error-key-1",
    initialErrorMessage: "账户新增失败。请确认账户名称是否重复，或稍后重试。",
  },
};

export const SaveSucceeded: Story = {
  name: "保存成功反馈",
  args: {
    saveResult: "updated",
  },
};

export const CreateSucceeded: Story = {
  name: "新增成功反馈",
  args: {
    saveResult: "created",
  },
};

export const ArchiveSucceeded: Story = {
  name: "删除成功反馈",
  args: {
    saveResult: "archived",
  },
};

export const MultipleHolders: Story = {
  name: "多持有人多账户",
  args: {
    holderOptions: [
      {
        user_id: "user-1",
        display_name: "本地开发用户",
        email: "local1@example.test",
      },
      {
        user_id: "user-2",
        display_name: "本地开发用户2",
        email: "local2@example.test",
      },
    ],
    accounts: [
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
      {
        id: "00000000-0000-4000-8000-000000000002",
        name: "楽天カード",
        type: "credit_card",
        currency: "JPY",
        initial_balance: 0,
        current_balance: -12500,
        sort_order: 2,
        created_at: "2026-01-02T00:00:00.000Z",
        holders: [
          {
            id: "holder-3",
            user_id: "user-2",
            display_name: "本地开发用户2",
            email: "local2@example.test",
            display_color: "sakura",
            role: "owner",
            share_ratio: null,
          },
        ],
      },
      {
        id: "00000000-0000-4000-8000-000000000003",
        name: "PayPay",
        type: "e_money",
        currency: "JPY",
        initial_balance: 0,
        current_balance: 3200,
        sort_order: 3,
        created_at: "2026-01-03T00:00:00.000Z",
        holders: [],
      },
    ],
  },
};
