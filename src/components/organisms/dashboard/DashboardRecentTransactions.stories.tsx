import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { createDashboardRecentTransaction } from "@/test/mocks/dashboard";

import { DashboardRecentTransactions } from "./DashboardRecentTransactions";

const meta = {
  title: "Organisms/Dashboard/RecentTransactions",
  component: DashboardRecentTransactions,
  args: {
    hasLedger: true,
    transactions: [createDashboardRecentTransaction()],
  },
} satisfies Meta<typeof DashboardRecentTransactions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "最近记录",
};

export const Empty: Story = {
  name: "空状态",
  args: {
    transactions: [],
  },
};

export const NoLedger: Story = {
  name: "无账本空状态",
  args: {
    hasLedger: false,
    transactions: [],
  },
};
