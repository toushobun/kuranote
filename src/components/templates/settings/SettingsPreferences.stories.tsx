import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UserThemeProvider } from "theme/UserThemeProvider";

import { SettingsPreferencesTemplate } from "./SettingsPreferences";

const meta = {
  title: "Templates/Settings/SettingsPreferencesTemplate",
  component: SettingsPreferencesTemplate,
  decorators: [
    (Story) => (
      <UserThemeProvider storageScope="storybook-settings-preferences">
        <Story />
      </UserThemeProvider>
    ),
  ],
  args: {
    updateTransactionColorSchemeAction: async (_state, formData) => ({
      success: "收支配色方案已保存。",
      transactionColorScheme: formData.get("transactionColorScheme") as
        | "expense_green_income_red"
        | "expense_red_income_green",
    }),
  },
} satisfies Meta<typeof SettingsPreferencesTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "App 偏好设置 / 设置项",
};
