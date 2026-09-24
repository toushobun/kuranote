import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LedgerInviteTakeoverNotice } from "./LedgerInviteTakeoverNotice";

const meta = {
  title: "Molecules/Ledgers/LedgerInviteTakeoverNotice",
  component: LedgerInviteTakeoverNotice,
  args: { name: "奶奶" },
} satisfies Meta<typeof LedgerInviteTakeoverNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "接管说明",
};

export const LongName: Story = {
  name: "较长名字（移动端）",
  args: { name: "住在老家的外婆（妈妈那边）" },
  parameters: { viewport: { defaultViewport: "mobile2" } },
};
