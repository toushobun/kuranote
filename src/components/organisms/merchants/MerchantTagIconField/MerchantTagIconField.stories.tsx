import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { MerchantTagIconField } from "./MerchantTagIconField";

const meta = {
  title: "Organisms/Merchants/MerchantTagIconField",
  component: MerchantTagIconField,
  args: { onChange: () => {}, value: "🛒" },
  render: function MerchantTagIconFieldStory() {
    const [value, setValue] = useState("🛒");
    return <MerchantTagIconField onChange={setValue} value={value} />;
  },
} satisfies Meta<typeof MerchantTagIconField>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "商家标签图标" };
