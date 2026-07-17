import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { CategoryIconField } from "./CategoryIconField";

const meta = {
  title: "Organisms/Categories/CategoryIconField",
  component: CategoryIconField,
  args: { onChange: () => {}, value: "🍜" },
  render: function CategoryIconFieldStory() {
    const [value, setValue] = useState("🍜");

    return <CategoryIconField onChange={setValue} value={value} />;
  },
} satisfies Meta<typeof CategoryIconField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Emoji 图标选择器",
};
