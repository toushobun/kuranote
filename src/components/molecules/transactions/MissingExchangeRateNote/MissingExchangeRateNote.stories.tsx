import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MissingExchangeRateNote } from "./MissingExchangeRateNote";

const meta: Meta<typeof MissingExchangeRateNote> = {
  component: MissingExchangeRateNote,
  title: "Molecules/Transactions/MissingExchangeRateNote",
};

export default meta;
type Story = StoryObj<typeof MissingExchangeRateNote>;

export const MissingRates: Story = {
  name: "缺少汇率",
  args: { missingRateCount: 2, align: "right" },
};

export const NoMissingRates: Story = {
  name: "汇率齐全时不显示",
  args: { missingRateCount: 0 },
};
