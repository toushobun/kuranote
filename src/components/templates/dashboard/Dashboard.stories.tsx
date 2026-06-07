import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DashboardTemplate } from "./Dashboard";

const meta = {
  title: "Templates/Dashboard/DashboardTemplate",
  component: DashboardTemplate,
  args: {
    data: {
      ledgerName: "家庭账本",
      monthLabel: "2026年6月",
      monthSummary: {
        balance: "180000",
        currency: "JPY",
        expense: "80000",
        income: "260000",
      },
      recentTransactions: [],
      todayExpense: { expense: "331", currency: "JPY", recordCount: 2 },
      weekExpense: { expense: "2840", currency: "JPY", recordCount: 8 },
    },
  },
} satisfies Meta<typeof DashboardTemplate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
