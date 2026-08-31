import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UserThemeProvider } from "theme/UserThemeProvider";

import { TransactionColorSchemePicker } from "./TransactionColorSchemePicker";

const meta = {
  title: "Molecules/Theme/TransactionColorSchemePicker",
  component: TransactionColorSchemePicker,
  decorators: [
    (Story) => (
      <UserThemeProvider storageScope="storybook-transaction-colors">
        <div style={{ maxWidth: 360, padding: 16 }}>
          <Story />
        </div>
      </UserThemeProvider>
    ),
  ],
  args: {
    action: async (_state, formData) => ({
      success: "收支配色方案已保存。",
      transactionColorScheme: formData.get("transactionColorScheme") as
        "expense_green_income_red" | "expense_red_income_green",
    }),
  },
} satisfies Meta<typeof TransactionColorSchemePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "支出绿 / 收入红（默认）",
};

export const ExpenseRed: Story = {
  name: "支出红 / 收入绿",
  decorators: [
    (Story) => (
      <UserThemeProvider
        initialTransactionColorScheme="expense_red_income_green"
        storageScope="storybook-transaction-colors-expense-red"
      >
        <Story />
      </UserThemeProvider>
    ),
  ],
};
