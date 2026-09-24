import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { UserThemeProvider } from "theme/UserThemeProvider";

import { createPlaceholderAccountHolder } from "test/mocks/accountHolders";

import { AccountEditForm } from "./AccountEditForm";

const holderOptions = [
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
];

const baseAccount = {
  id: "account-1",
  name: "三菱UFJ银行",
  type: "bank",
  currency: "JPY",
  initial_balance: 100000,
  current_balance: 85000,
  sort_order: 0,
  created_at: "2026-06-03T00:00:00.000Z",
} as const;

const meta: Meta<typeof AccountEditForm> = {
  component: AccountEditForm,
  decorators: [
    (Story) => (
      <UserThemeProvider storageScope="storybook-account-edit-form">
        <ConfirmDialogProvider>
          <Story />
        </ConfirmDialogProvider>
      </UserThemeProvider>
    ),
  ],
  title: "Organisms/Accounts/AccountEditForm",
};

export default meta;
type Story = StoryObj<typeof AccountEditForm>;

export const SingleHolderAccount: Story = {
  name: "单人持有账户",
  args: {
    account: {
      ...baseAccount,
      holders: [
        {
          id: "holder-1",
          user_id: "user-1",
          kind: "member" as const,
          placeholder_id: null,
          display_name: "本地开发用户",
          email: "local1@example.test",
          display_color: "sky",
          role: "owner",
          share_ratio: null,
        },
      ],
    },
    holderOptions,
    updateAccountAction: async () => {},
  },
};

export const SharedHolderAccount: Story = {
  name: "存量数据：多人共同持有账户（仅预选第一个持有人）",
  args: {
    account: {
      ...baseAccount,
      name: "日元现金",
      type: "cash",
      holders: [
        {
          id: "holder-1",
          user_id: "user-1",
          kind: "member" as const,
          placeholder_id: null,
          display_name: "本地开发用户",
          email: "local1@example.test",
          display_color: "sky",
          role: "co_owner",
          share_ratio: null,
        },
        {
          id: "holder-2",
          user_id: "user-2",
          kind: "member" as const,
          placeholder_id: null,
          display_name: "本地开发用户2",
          email: "local2@example.test",
          display_color: "sakura",
          role: "co_owner",
          share_ratio: null,
        },
      ],
    },
    holderOptions,
    updateAccountAction: async () => {},
  },
};

export const NoHolderAccount: Story = {
  name: "未设置持有人账户",
  args: {
    account: {
      ...baseAccount,
      name: "备用账户",
      type: "other",
      holders: [],
    },
    holderOptions,
    updateAccountAction: async () => {},
  },
};

export const WithArchiveAction: Story = {
  name: "带删除按钮",
  args: {
    account: {
      ...baseAccount,
      holders: [
        {
          id: "holder-1",
          user_id: "user-1",
          kind: "member" as const,
          placeholder_id: null,
          display_name: "本地开发用户",
          email: "local1@example.test",
          display_color: "sky",
          role: "owner",
          share_ratio: null,
        },
      ],
    },
    archiveAccountAction: async () => {},
    holderOptions,
    updateAccountAction: async () => {},
  },
};

export const InactiveHolderPreserved: Story = {
  name: "保留非活跃持有人",
  args: {
    account: {
      ...baseAccount,
      name: "旧信用卡",
      type: "credit_card",
      holders: [
        {
          id: "holder-1",
          user_id: "user-1",
          kind: "member" as const,
          placeholder_id: null,
          display_name: "本地开发用户",
          email: "local1@example.test",
          display_color: "sky",
          role: "owner",
          share_ratio: null,
        },
        {
          id: "holder-3",
          user_id: "user-3",
          kind: "member" as const,
          placeholder_id: null,
          display_name: "停用用户",
          email: "inactive@example.test",
          display_color: "amber",
          role: "co_owner",
          share_ratio: null,
        },
      ],
    },
    holderOptions,
    updateAccountAction: async () => {},
  },
};

const placeholderHolder = createPlaceholderAccountHolder();

export const PlaceholderHolderAccount: Story = {
  name: "待邀请成员持有的账户（三态持有人）",
  args: {
    account: { ...baseAccount, holders: [placeholderHolder] },
    holderOptions,
    placeholderHolderOptions: [
      {
        display_name: placeholderHolder.display_name,
        placeholder_id: placeholderHolder.placeholder_id,
      },
      { display_name: "爷爷", placeholder_id: "placeholder-2" },
    ],
    updateAccountAction: async () => {},
  },
};

export const PlaceholderHolderAccountMobile: Story = {
  ...PlaceholderHolderAccount,
  name: "待邀请成员持有的账户（移动端）",
  parameters: { viewport: { defaultViewport: "mobile2" } },
};
