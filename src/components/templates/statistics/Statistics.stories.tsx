import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StatisticsTemplate } from "./Statistics";

const meta = {
  title: "Templates/Statistics/StatisticsTemplate",
  component: StatisticsTemplate,
  args: {
    ledgerName: "家庭账本",
  },
} satisfies Meta<typeof StatisticsTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "统计页面",
};
