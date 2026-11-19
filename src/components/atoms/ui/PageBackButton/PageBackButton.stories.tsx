import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PageBackButton } from "./PageBackButton";

const meta = {
  title: "Atoms/UI/PageBackButton",
  component: PageBackButton,
  args: { "aria-label": "返回设置", href: "/settings" },
} satisfies Meta<typeof PageBackButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "无框返回箭头" };
