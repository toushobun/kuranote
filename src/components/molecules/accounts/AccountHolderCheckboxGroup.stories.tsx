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
  name: "选中活跃持有人 + 保留非活跃持有人",
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

const placeholderOptions = [
  { placeholder_id: "placeholder-1", display_name: "奶奶" },
  { placeholder_id: "placeholder-2", display_name: "爷爷" },
];

export const WithPlaceholderOptions: Story = {
  name: "三态：成员 + 待邀请成员（无选中即无持有人）",
  args: { placeholderOptions },
};

export const PlaceholderSelected: Story = {
  name: "三态：已选中待邀请成员",
  args: { placeholderOptions, selectedPlaceholderId: "placeholder-1" },
};

export const PlaceholderOnly: Story = {
  name: "三态：只有待邀请成员可选",
  args: { holderOptions: [], placeholderOptions },
};

export const PlaceholderMobile: Story = {
  name: "三态：移动端",
  args: { placeholderOptions, selectedPlaceholderId: "placeholder-2" },
  parameters: {
    viewport: { defaultViewport: "mobile2" },
  },
};
