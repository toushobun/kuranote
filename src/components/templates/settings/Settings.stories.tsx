import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UserThemeProvider } from "theme/UserThemeProvider";

import { SettingsTemplate } from "./Settings";

const meta = {
  title: "Templates/Settings/SettingsTemplate",
  component: SettingsTemplate,
  decorators: [
    (Story) => (
      <UserThemeProvider storageScope="storybook-settings">
        <Story />
      </UserThemeProvider>
    ),
  ],
  args: {
    currentLedgerName: "家庭账本",
    logoutAction: () => undefined,
    updateTransactionColorSchemeAction: async (_state, formData) => ({
      success: "收支配色方案已保存。",
      transactionColorScheme: formData.get("transactionColorScheme") as
        "expense_green_income_red" | "expense_red_income_green",
    }),
  },
} satisfies Meta<typeof SettingsTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "我的 / 设置入口页",
};
