import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { userEvent, within } from "storybook/test";
import { UserThemeProvider } from "theme/UserThemeProvider";

import { CategoryIconField } from "./CategoryIconField";

const meta = {
  title: "Organisms/Categories/CategoryIconField",
  component: CategoryIconField,
  decorators: [
    (Story) => (
      <UserThemeProvider storageScope="storybook-category-icon">
        <Story />
      </UserThemeProvider>
    ),
  ],
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

export const Grouped: Story = {
  name: "分类图标小弹窗分组浏览",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "选择图标" }),
    );
  },
};
