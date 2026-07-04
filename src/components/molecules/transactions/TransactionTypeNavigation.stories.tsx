import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { TransactionTypeNavigation } from "./TransactionTypeNavigation";

const meta = {
  title: "Molecules/Transactions/TransactionTypeNavigation",
  component: TransactionTypeNavigation,
  render: function TransactionTypeNavigationStory(args) {
    const [activeType, setActiveType] = useState(args.activeType);

    return (
      <TransactionTypeNavigation
        {...args}
        activeType={activeType}
        onChange={setActiveType}
      />
    );
  },
  args: {
    activeType: "normal",
    onChange: () => undefined,
  },
} satisfies Meta<typeof TransactionTypeNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  name: "收支选中",
  args: { activeType: "normal" },
};

export const Transfer: Story = {
  name: "转账选中",
  args: { activeType: "transfer" },
};
