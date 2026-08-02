import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { TransactionPendingReimbursementCheckbox } from "./TransactionPendingReimbursementCheckbox";

const meta = {
  title: "Organisms/Transactions/TransactionPendingReimbursementCheckbox",
  component: TransactionPendingReimbursementCheckbox,
  render: function Story(args) {
    const [checked, setChecked] = useState(args.checked);
    return (
      <TransactionPendingReimbursementCheckbox
        {...args}
        checked={checked}
        onChange={setChecked}
      />
    );
  },
} satisfies Meta<typeof TransactionPendingReimbursementCheckbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = { args: { checked: false, onChange() {} } };
export const Checked: Story = { args: { checked: true, onChange() {} } };
