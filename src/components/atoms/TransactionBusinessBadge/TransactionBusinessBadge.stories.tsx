import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TransactionBusinessBadge } from "./TransactionBusinessBadge";
import { transactionBusinessBadgeStatuses } from "./transactionBusinessBadgeConfig";

function TransactionBusinessBadgePreview() {
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
      {transactionBusinessBadgeStatuses.map((status) => (
        <TransactionBusinessBadge key={status} status={status} />
      ))}
    </Stack>
  );
}

const meta = {
  title: "Atoms/TransactionBusinessBadge",
  component: TransactionBusinessBadge,
  argTypes: {
    status: {
      control: "select",
      options: transactionBusinessBadgeStatuses,
    },
  },
} satisfies Meta<typeof TransactionBusinessBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "全部业务状态",
  args: {
    status: "pendingReimbursement",
  },
  render: () => <TransactionBusinessBadgePreview />,
};

export const CustomLabel: Story = {
  name: "自定义文案",
  args: {
    label: "公司报销中",
    status: "pendingReimbursement",
  },
};
