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
    logoutAction: () => undefined,
  },
} satisfies Meta<typeof SettingsTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "我的 / 设置入口页",
};
