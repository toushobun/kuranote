import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { TransactionReimbursementLinkPicker } from "./TransactionReimbursementLinkPicker";

const candidates = [
  {
    amount: "1200",
    categoryName: "交通费",
    id: "00000000-0000-4000-8000-000000000001",
    transactionAt: "2026-08-01T00:00:00.000Z",
  },
  {
    amount: "3480",
    categoryName: "住宿费",
    id: "00000000-0000-4000-8000-000000000002",
    transactionAt: "2026-07-28T00:00:00.000Z",
  },
];

const meta = {
  title: "Organisms/Transactions/TransactionReimbursementLinkPicker",
  component: TransactionReimbursementLinkPicker,
  render: function Story(args) {
    const [selectedIds, setSelectedIds] = useState(args.selectedIds);
    return (
      <TransactionReimbursementLinkPicker
        {...args}
        onChange={setSelectedIds}
        selectedIds={selectedIds}
      />
    );
  },
} satisfies Meta<typeof TransactionReimbursementLinkPicker>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { candidates, onChange() {}, selectedIds: [] },
};
export const Empty: Story = {
  args: { candidates: [], onChange() {}, selectedIds: [] },
};
