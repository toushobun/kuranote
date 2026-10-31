import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import type { AccountType } from "types/accounts";

import { AccountTypePicker } from "./AccountTypePicker";

function AccountTypePickerPreview({
  initialValue,
}: {
  initialValue: AccountType | null;
}) {
  const [value, setValue] = useState(initialValue);
  return <AccountTypePicker name="type" onChange={setValue} value={value} />;
}

const meta = {
  title: "Molecules/Accounts/AccountTypePicker",
  component: AccountTypePickerPreview,
  args: { initialValue: null },
} satisfies Meta<typeof AccountTypePickerPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = { name: "未选择" };
export const Selected: Story = {
  name: "已选择信用卡",
  args: { initialValue: "credit_card" },
};
