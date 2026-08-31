import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MerchantAvatar } from "./MerchantAvatar";

const meta = {
  title: "Organisms/Merchants/MerchantAvatar",
  component: MerchantAvatar,
  args: {
    size: 96,
    toneKey: "merchant-1",
  },
} satisfies Meta<typeof MerchantAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {
  name: "店铺插画占位",
};

export const Loading: Story = {
  name: "头像抓取中",
  args: { loading: true },
};
