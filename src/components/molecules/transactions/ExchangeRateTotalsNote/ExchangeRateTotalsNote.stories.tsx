import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ExchangeRateTotalsNote } from "./ExchangeRateTotalsNote";

const meta: Meta<typeof ExchangeRateTotalsNote> = {
  component: ExchangeRateTotalsNote,
  title: "Molecules/Transactions/ExchangeRateTotalsNote",
};

export default meta;
type Story = StoryObj<typeof ExchangeRateTotalsNote>;

export const Converted: Story = {
  name: "已换算外币",
  args: { hasForeignCurrency: true },
};

export const MissingRates: Story = {
  name: "缺少汇率",
  args: {
    hasForeignCurrency: true,
    missingRateCount: 2,
    align: "right",
  },
};

export const NoForeign: Story = {
  name: "无外币时不显示",
  args: { hasForeignCurrency: false, missingRateCount: 0 },
};
