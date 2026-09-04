import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MerchantAvatar } from "./MerchantAvatar";

const wideLogoDataUrl =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxODAiIGhlaWdodD0iOTAiIHZpZXdCb3g9IjAgMCAxODAgOTAiPgo8cmVjdCB3aWR0aD0iMTgwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjZmZmN2VkIi8+CjxyZWN0IHg9IjYwIiB5PSIyMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjUwIiByeD0iMTIiIGZpbGw9IiNmYjkyM2MiLz4KPHRleHQgeD0iOTAiIHk9IjUyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9IjcwMCIgZmlsbD0iIzdjMmQxMiI+TE9HTzwvdGV4dD4KPC9zdmc+";

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

export const UploadedWideLogo: Story = {
  name: "已上传宽幅 Logo（cover 裁切）",
  args: { src: wideLogoDataUrl },
};

export const Loading: Story = {
  name: "头像抓取中",
  args: { loading: true },
};
