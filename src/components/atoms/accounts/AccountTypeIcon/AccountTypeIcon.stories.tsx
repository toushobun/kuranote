import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { accountTypeOptions } from "types/accounts";

import { AccountTypeIcon } from "./AccountTypeIcon";

const meta = {
  title: "Atoms/Accounts/AccountTypeIcon",
  component: AccountTypeIcon,
  args: { type: "bank" },
} satisfies Meta<typeof AccountTypeIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "银行卡",
};

export const AllTypes: Story = {
  name: "全部类型",
  render: () => (
    <Stack direction="row" spacing={2}>
      {accountTypeOptions.map(({ label, value }) => (
        <Stack key={value} spacing={0.5} sx={{ alignItems: "center" }}>
          <AccountTypeIcon type={value} />
          <span>{label}</span>
        </Stack>
      ))}
    </Stack>
  ),
};
