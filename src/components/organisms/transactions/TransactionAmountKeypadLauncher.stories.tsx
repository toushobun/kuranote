import { useState } from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TransactionAmountKeypadLauncher } from "./TransactionAmountKeypadLauncher";

function LauncherDemo() {
  const [amount, setAmount] = useState("0");
  const [memo, setMemo] = useState("");

  return (
    <Box sx={{ minHeight: 520, p: 3 }}>
      <Stack spacing={2} sx={{ maxWidth: 360 }}>
        <TextField
          data-amount-currency="JPY"
          data-amount-input="true"
          inputMode="decimal"
          label="金额"
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0"
          value={amount}
        />
        <TextField
          label="普通输入框"
          onChange={(event) => setMemo(event.target.value)}
          placeholder="0"
          value={memo}
        />
        <Typography color="text.secondary" variant="body2">
          当前金额：{amount}
        </Typography>
      </Stack>
      <TransactionAmountKeypadLauncher />
    </Box>
  );
}

const meta = {
  title: "Organisms/Transactions/TransactionAmountKeypadLauncher",
  component: TransactionAmountKeypadLauncher,
  render: () => <LauncherDemo />,
} satisfies Meta<typeof TransactionAmountKeypadLauncher>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "金额输入框触发键盘",
};
