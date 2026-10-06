import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { SettingsEntryGroupCard } from "organisms/settings/SettingsEntryList/SettingsEntryList";
import { UserThemeProvider } from "theme/UserThemeProvider";
import {
  failedLinkGoogleIdentityAction,
  failedUnlinkGoogleIdentityAction,
  googleIdentityAlreadyExistsMessage,
  googleOnlyIdentity,
  pendingLinkGoogleIdentityAction,
  succeededUnlinkGoogleIdentityAction,
  unlinkableGoogleIdentity,
  unlinkedGoogleIdentity,
} from "test/userProfileFixtures";

import { ProfileAccountLinking } from "./ProfileAccountLinking";

const meta = {
  title: "Organisms/Settings/ProfileAccountLinking",
  component: ProfileAccountLinking,
  decorators: [
    (Story) => (
      <UserThemeProvider>
        <ConfirmDialogProvider>
          <SettingsEntryGroupCard label="账号安全">
            <Story />
          </SettingsEntryGroupCard>
        </ConfirmDialogProvider>
      </UserThemeProvider>
    ),
  ],
  args: {
    googleIdentity: unlinkedGoogleIdentity,
    isLast: true,
    linkAction: pendingLinkGoogleIdentityAction,
    linkFeedback: null,
    unlinkAction: succeededUnlinkGoogleIdentityAction,
  },
} satisfies Meta<typeof ProfileAccountLinking>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unlinked: Story = {
  name: "未绑定（点击绑定后等待跳转）",
};

export const LinkStartFailed: Story = {
  name: "未绑定（无法连接 Google）",
  args: { linkAction: failedLinkGoogleIdentityAction },
};

export const Linked: Story = {
  name: "已绑定（可解除绑定）",
  args: { googleIdentity: unlinkableGoogleIdentity },
};

export const UnlinkFailed: Story = {
  name: "已绑定（解除绑定失败）",
  args: {
    googleIdentity: unlinkableGoogleIdentity,
    unlinkAction: failedUnlinkGoogleIdentityAction,
  },
};

export const GoogleOnly: Story = {
  name: "已绑定（Google 是唯一登录身份，禁止解除）",
  args: { googleIdentity: googleOnlyIdentity },
};

export const LinkedFromCallback: Story = {
  name: "Google 授权回跳：绑定成功",
  args: {
    googleIdentity: unlinkableGoogleIdentity,
    linkFeedback: { kind: "success" },
  },
};

export const IdentityAlreadyExists: Story = {
  name: "Google 授权回跳：该 Google 账号已被其他用户使用",
  args: {
    linkFeedback: {
      kind: "failure",
      message: googleIdentityAlreadyExistsMessage,
    },
  },
};
