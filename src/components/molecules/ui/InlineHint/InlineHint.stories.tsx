import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { InlineHint } from "./InlineHint";

const meta = {
  title: "Molecules/UI/InlineHint",
  component: InlineHint,
  args: {
    children: "可按分类筛选商家",
  },
} satisfies Meta<typeof InlineHint>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
