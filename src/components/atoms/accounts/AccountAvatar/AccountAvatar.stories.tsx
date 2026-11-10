import { accountWebsiteIconFixture } from "test/mocks/accounts";
import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AccountAvatar } from "./AccountAvatar";

const meta = {
  title: "Atoms/Accounts/AccountAvatar",
  component: AccountAvatar,
  args: { id: "account-1", name: "三井住友银行", size: 48 },
} satisfies Meta<typeof AccountAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "中文账户名" };

export const Variants: Story = {
  name: "各种账户名与尺寸",
  render: () => (
    <Stack spacing={2}>
      {[48, 28].map((size) => (
        <Stack key={size} direction="row" spacing={1.5}>
          {[
            "三井住友银行",
            "日元现金",
            "PayPay",
            "Rakuten Card",
            "ゆうちょ",
          ].map((name, index) => (
            <AccountAvatar
              key={name}
              id={`account-${index}`}
              name={name}
              size={size}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  ),
};

export const WebsiteIcon: Story = {
  name: "网站图标",
  args: { iconUrl: accountWebsiteIconFixture.icon_url },
};
