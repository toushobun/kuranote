import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AccountHolderCheckboxGroup } from "./AccountHolderCheckboxGroup";

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

const meta = {
  title: "Molecules/Accounts/AccountHolderCheckboxGroup",
  component: AccountHolderCheckboxGroup,
  args: { holderOptions },
} satisfies Meta<typeof AccountHolderCheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "默认（无选中）",
};

export const WithSelected: Story = {
  name: "已选中持有人",
  args: {
    selectedUserIds: ["user-1"],
  },
};

export const Empty: Story = {
  name: "无可选持有人",
  args: {
    holderOptions: [],
  },
};

export const WithPreservedOptions: Story = {
  name: "含非活跃持有人",
  args: {
    preservedHolderOptions: [
      {
        user_id: "user-3",
        display_name: "已离开用户",
        email: "left@example.test",
      },
    ],
  },
};

export const AllSelected: Story = {
  name: "全部选中",
  args: {
    selectedUserIds: ["user-1", "user-2"],
  },
};

export const SingleHolder: Story = {
  name: "仅一位持有人",
  args: {
    holderOptions: [
      {
        user_id: "user-1",
        display_name: "本地开发用户",
        email: "local1@example.test",
      },
    ],
    selectedUserIds: ["user-1"],
  },
};

export const SelectedWithPreserved: Story = {
  name: "选中活跃 + 保留非活跃",
  args: {
    selectedUserIds: ["user-1"],
    preservedHolderOptions: [
      {
        user_id: "user-3",
        display_name: "已离开用户",
        email: "left@example.test",
      },
    ],
  },
};
