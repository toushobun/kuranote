import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import type { LedgerSetupRegion } from "internal/ledger";
import { LedgerRegionField } from "./LedgerRegionField";

const meta = {
  title: "Molecules/Ledgers/LedgerRegionField",
  component: LedgerRegionField,
  args: { value: null, onChange: () => {} },
  render: function Example(args) {
    const [value, setValue] = useState<LedgerSetupRegion | null>(args.value);
    return <LedgerRegionField {...args} value={value} onChange={setValue} />;
  },
} satisfies Meta<typeof LedgerRegionField>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Unselected: Story = { name: "未选择" };
export const Japan: Story = { name: "日本", args: { value: "jp" } };
