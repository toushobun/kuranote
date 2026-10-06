import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UserThemeProvider } from "theme/UserThemeProvider";
import {
  failedDisplayNameAction,
  familyLedgerId,
  pendingLinkGoogleIdentityAction,
  profileFixture,
  profileLedgerDisplayNames,
  succeededAvatarAction,
  succeededChangePasswordAction,
  succeededDisplayNameAction,
  succeededPasswordChangeOtpAction,
  succeededUnlinkGoogleIdentityAction,
  unlinkableGoogleIdentity,
  unlinkedGoogleIdentity,
} from "test/userProfileFixtures";

import { SettingsProfileTemplate } from "./SettingsProfile";

const meta = {
  title: "Templates/Settings/SettingsProfileTemplate",
  component: SettingsProfileTemplate,
  decorators: [
    (Story) => (
      <UserThemeProvider>
        <Story />
      </UserThemeProvider>
    ),
  ],
  args: {
    changePasswordAction: succeededChangePasswordAction,
    currentLedgerId: familyLedgerId,
    googleIdentity: unlinkedGoogleIdentity,
    googleIdentityLinkFeedback: null,
    ledgers: profileLedgerDisplayNames,
    linkGoogleIdentityAction: pendingLinkGoogleIdentityAction,
    logoutAction: () => undefined,
    profile: profileFixture,
    requestPasswordChangeOtpAction: succeededPasswordChangeOtpAction,
    unlinkGoogleIdentityAction: succeededUnlinkGoogleIdentityAction,
    updateAvatarAction: succeededAvatarAction,
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

export const GoogleLinked: Story = {
  name: "Google 绑定成功后回到个人主页",
  args: {
    googleIdentity: unlinkableGoogleIdentity,
    googleIdentityLinkFeedback: { kind: "success" },
  },
};
