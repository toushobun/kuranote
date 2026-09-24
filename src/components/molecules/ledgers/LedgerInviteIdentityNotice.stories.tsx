import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LedgerInviteIdentityNotice } from "./LedgerInviteIdentityNotice";

const meta = {
  title: "Molecules/Ledgers/LedgerInviteIdentityNotice",
  component: LedgerInviteIdentityNotice,
  args: { name: "奶奶" },
} satisfies Meta<typeof LedgerInviteIdentityNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "以某人身份加入说明",
};

export const LongName: Story = {
  name: "较长名字（移动端）",
  args: { name: "住在老家的外婆（妈妈那边）" },
  parameters: { viewport: { defaultViewport: "mobile2" } },
};
