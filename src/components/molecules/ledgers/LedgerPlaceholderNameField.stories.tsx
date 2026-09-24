import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LedgerPlaceholderNameField } from "./LedgerPlaceholderNameField";

const meta = {
  title: "Molecules/Ledgers/LedgerPlaceholderNameField",
  component: LedgerPlaceholderNameField,
} satisfies Meta<typeof LedgerPlaceholderNameField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  name: "邀请成员（空）",
};

export const Rename: Story = {
  name: "修改名字",
  args: { defaultValue: "奶奶", label: "修改名字" },
};

export const Mobile: Story = {
  name: "移动端",
  args: { defaultValue: "住在老家的外婆（妈妈那边）" },
  parameters: { viewport: { defaultViewport: "mobile2" } },
};
