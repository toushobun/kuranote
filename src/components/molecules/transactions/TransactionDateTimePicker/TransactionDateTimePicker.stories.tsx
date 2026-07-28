import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { TransactionDateTimePicker } from "./TransactionDateTimePicker";

const meta = {
  title: "Molecules/Transactions/TransactionDateTimePicker",
  component: TransactionDateTimePicker,
  args: {
    date: "2026-07-20",
    onDateChange: fn(),
    onTimeChange: fn(),
    time: "10:30:00",
  },
} satisfies Meta<typeof TransactionDateTimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "日期与时间",
};

export const DateOnly: Story = {
  name: "仅日期",
  args: {
    fieldLabel: "记账日期",
    openPickerLabel: "选择记账日期",
    showTime: false,
  },
};

export const MainStates: Story = {
  name: "主要可见状态",
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 420 }}>
      <TransactionDateTimePicker
        date="2026-07-20"
        onDateChange={fn()}
        onTimeChange={fn()}
        time="10:30:00"
      />
      <TransactionDateTimePicker
        date=""
        fieldLabel="记账日期"
        onDateChange={fn()}
        openPickerLabel="选择记账日期"
        showTime={false}
      />
    </Stack>
  ),
};
