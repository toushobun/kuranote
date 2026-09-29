import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UserThemeProvider } from "theme/UserThemeProvider";
import {
  familyLedgerId,
  failedDisplayNameAction,
  profileLedgerDisplayNames,
  succeededDisplayNameAction,
} from "test/userProfileFixtures";

import { ProfileNicknameDialog } from "./ProfileNicknameDialog";

const meta = {
  title: "Organisms/Settings/ProfileNicknameDialog",
  component: ProfileNicknameDialog,
  decorators: [
    (Story) => (
      <UserThemeProvider storageScope="storybook-profile-nickname-dialog">
        <Story />
      </UserThemeProvider>
    ),
  ],
  args: {
    action: succeededDisplayNameAction,
    currentDisplayName: "淞文",
    currentLedgerId: familyLedgerId,
    ledgers: profileLedgerDisplayNames,
    onClose: () => {},
    open: true,
  },
} satisfies Meta<typeof ProfileNicknameDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLedgers: Story = {
  name: "有账本（保存后询问是否同步）",
};

export const WithoutLedgers: Story = {
  name: "无账本（直接保存）",
  args: { currentLedgerId: null, ledgers: [] },
};

export const SaveFailed: Story = {
  name: "保存失败",
  args: {
    action: failedDisplayNameAction,
  },
};
