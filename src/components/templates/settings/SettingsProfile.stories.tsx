import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UserThemeProvider } from "theme/UserThemeProvider";
import {
  failedDisplayNameAction,
  familyLedgerId,
  profileFixture,
  profileLedgerDisplayNames,
  succeededDisplayNameAction,
} from "test/userProfileFixtures";

import { SettingsProfileTemplate } from "./SettingsProfile";

const meta = {
  title: "Templates/Settings/SettingsProfileTemplate",
  component: SettingsProfileTemplate,
  decorators: [
    (Story) => (
      <UserThemeProvider storageScope="storybook-settings-profile">
        <Story />
      </UserThemeProvider>
    ),
  ],
  args: {
    currentLedgerId: familyLedgerId,
    ledgers: profileLedgerDisplayNames,
    logoutAction: () => undefined,
    profile: profileFixture,
    updateDisplayNameAction: succeededDisplayNameAction,
  },
} satisfies Meta<typeof SettingsProfileTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "个人主页（有账本）",
};

export const WithAvatar: Story = {
  name: "个人主页（有头像）",
  args: {
    profile: {
      ...profileFixture,
      avatarUrl: "https://avatars.githubusercontent.com/u/92347214?v=4",
    },
  },
};

export const WithoutLedgers: Story = {
  name: "个人主页（无账本，保存时不弹同步确认）",
  args: { currentLedgerId: null, ledgers: [] },
};

export const SaveFailed: Story = {
  name: "昵称保存失败",
  args: {
    updateDisplayNameAction: failedDisplayNameAction,
  },
};
