import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import type { TransactionSpecialStatusValue } from "../TransactionBusinessBadge/transactionBusinessBadgeConfig";
import { TransactionSpecialStatusSelector } from "./TransactionSpecialStatusSelector";

function InteractivePreview() {
  const [value, setValue] = useState<TransactionSpecialStatusValue>(null);

  return (
    <Stack spacing={2} sx={{ maxWidth: 460 }}>
      <TransactionSpecialStatusSelector onChange={setValue} value={value} />
      <Typography color="text.secondary" variant="body2">
        当前选择：{value ?? "无特殊状态"}
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

export const Interactive: Story = {
  name: "可交互选择",
  render: () => <InteractivePreview />,
};

export const Empty: Story = {
  name: "无特殊状态",
};

export const Loading: Story = {
  name: "加载状态",
  args: { state: "loading" },
};

export const Error: Story = {
  name: "错误状态",
  args: { onRetry: () => undefined, state: "error" },
};
