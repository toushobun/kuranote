import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { LedgerSetupContinueCard } from "./LedgerSetupContinueCard";

const meta = {
  title: "Organisms/Ledgers/LedgerSetupContinueCard",
  component: LedgerSetupContinueCard,
  args: {
    onContinue: fn(),
    setup: { name: "我们家", step: 3 },
  },
} satisfies Meta<typeof LedgerSetupContinueCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "进行到第 3 步",
};

export const FirstStep: Story = {
  name: "进行到第 1 步",
  args: { setup: { name: "我们家", step: 1 } },
};

export const LongName: Story = {
  name: "账本名较长",
  args: {
    setup: { name: "二〇二六年家庭日常开销与旅行共用账本", step: 5 },
  },
};
