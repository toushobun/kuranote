import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import type { TransactionSpecialStatusValue } from "../TransactionBusinessBadge/transactionBusinessBadgeConfig";
import { TransactionSpecialStatusSelector } from "./TransactionSpecialStatusSelector";

function InteractivePreview() {
  const [value, setValue] = useState<TransactionSpecialStatusValue>(
    "pendingReimbursement",
  );

  return (
    <Stack spacing={2} sx={{ maxWidth: 460 }}>
      <TransactionSpecialStatusSelector onChange={setValue} value={value} />
      <Typography color="text.secondary" variant="body2">
        当前选择：{value ?? "未启用"}
      </Typography>
    </Stack>
  );
}

const meta = {
  title: "Organisms/Transactions/TransactionSpecialStatusSelector",
  component: TransactionSpecialStatusSelector,
  args: {
    onChange: () => undefined,
    value: null,
  },
} satisfies Meta<typeof TransactionSpecialStatusSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  name: "折叠态",
};

export const Expanded: Story = {
  name: "展开态（默认待报销）",
  args: { value: "pendingReimbursement" },
};

export const Interactive: Story = {
  name: "切换到其他状态",
  render: () => <InteractivePreview />,
};

export const Loading: Story = {
  name: "加载状态",
  args: { state: "loading" },
};

export const Error: Story = {
  name: "错误状态",
  args: { onRetry: () => undefined, state: "error" },
};
