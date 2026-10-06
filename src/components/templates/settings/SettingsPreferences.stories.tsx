import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { userErrorMessages, type UserThemeKey } from "internal/user";
import { UserThemeProvider } from "theme/UserThemeProvider";
import type { ThemeKeyActionState } from "types/user";

import { SettingsPreferencesTemplate } from "./SettingsPreferences";

const meta = {
  title: "Templates/Settings/SettingsPreferencesTemplate",
  component: SettingsPreferencesTemplate,
  decorators: [
    (Story) => (
      <UserThemeProvider initialThemeKey="emeraldMorning">
        <Story />
      </UserThemeProvider>
    ),
  ],
  args: {
    updateThemeKeyAction: async (
      _state: ThemeKeyActionState,
      formData: FormData,
    ): Promise<ThemeKeyActionState> => ({
      themeKey: formData.get("themeKey") as UserThemeKey,
    }),
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

export const ThemeSaveFailed: Story = {
  name: "App 偏好设置 / 主题保存失败时回滚",
  args: {
    updateThemeKeyAction: async () => ({
      error: userErrorMessages.themeKeyUpdateFailed,
      errorKey: crypto.randomUUID(),
    }),
  },
};
