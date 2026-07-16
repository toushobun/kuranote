import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LedgerInviteQrCode } from "./LedgerInviteQrCode";

const inviteLink =
  "https://kuranote.example/invite/0123456789abcdef0123456789abcdef";

const meta: Meta<typeof LedgerInviteQrCode> = {
  component: LedgerInviteQrCode,
  title: "Molecules/Ledgers/LedgerInviteQrCode",
};

export default meta;
type Story = StoryObj<typeof LedgerInviteQrCode>;

export const Default: Story = {
  name: "默认二维码",
  args: {
    ledgerName: "家庭账本",
    link: inviteLink,
  },
};

export const LinkUnavailable: Story = {
  name: "链接已失效",
  args: {
    emptyMessage: "该邀请链接已失效，无法显示二维码",
    ledgerName: "家庭账本",
    link: "",
  },
};

export const MobileWidth: Story = {
  name: "移动端宽度",
  args: {
    ledgerName: "家庭账本",
    link: inviteLink,
  },
  decorators: [
    (StoryComponent) => (
      <Box sx={{ maxWidth: 320, px: 2, width: "100%" }}>
        <StoryComponent />
      </Box>
    ),
  ],
};
