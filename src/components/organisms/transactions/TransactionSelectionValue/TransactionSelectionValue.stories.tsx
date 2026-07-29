import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TransactionSelectionValue } from "./TransactionSelectionValue";

const meta = {
  title: "Organisms/Transactions/TransactionSelectionValue",
  component: TransactionSelectionValue,
  args: {
    icon: <AccountBalanceWalletRoundedIcon />,
    iconLabel: "账户",
    text: "现金账户",
    tone: "account",
  },
} satisfies Meta<typeof TransactionSelectionValue>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "账户选择值",
};

export const MainTones: Story = {
  name: "主要语义状态",
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 320 }}>
      <TransactionSelectionValue
        icon={<AccountBalanceWalletRoundedIcon />}
        iconLabel="账户"
        text="现金账户"
        tone="account"
      />
      <TransactionSelectionValue
        icon={<StorefrontRoundedIcon />}
        iconLabel="商家"
        text="附近超市"
        tone="merchant"
      />
      <TransactionSelectionValue
        icon={<ArrowDownwardRoundedIcon />}
        iconLabel="转出账户"
        text="日常账户"
        tone="outgoing"
      />
      <TransactionSelectionValue
        icon={<ArrowUpwardRoundedIcon />}
        iconLabel="转入账户"
        text="储蓄账户"
        tone="incoming"
      />
    </Stack>
  ),
};
