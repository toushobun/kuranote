import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UserThemeProvider } from "theme/UserThemeProvider";
import {
  failedChangePasswordAction,
  rateLimitedPasswordChangeOtpAction,
  succeededChangePasswordAction,
  succeededPasswordChangeOtpAction,
} from "test/userProfileFixtures";

import { ProfilePasswordDialog } from "./ProfilePasswordDialog";

const meta = {
  title: "Organisms/Settings/ProfilePasswordDialog",
  component: ProfilePasswordDialog,
  decorators: [
    (Story) => (
      <UserThemeProvider>
        <Story />
      </UserThemeProvider>
    ),
  ],
  args: {
    changePasswordAction: succeededChangePasswordAction,
    email: "user@example.com",
    onClose: () => {},
    open: true,
    requestOtpAction: succeededPasswordChangeOtpAction,
  },
} satisfies Meta<typeof ProfilePasswordDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "发送验证码后修改密码",
};

export const SendRateLimited: Story = {
  name: "验证码发送过于频繁",
  args: { requestOtpAction: rateLimitedPasswordChangeOtpAction },
};

export const SaveFailed: Story = {
  name: "验证码错误导致保存失败",
  args: { changePasswordAction: failedChangePasswordAction },
};
