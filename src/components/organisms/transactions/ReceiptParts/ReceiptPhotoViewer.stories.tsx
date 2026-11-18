import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ReceiptPhotoViewer } from "./ReceiptPhotoViewer";

const receipt =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="650"><rect width="400" height="650" fill="#f3eee5"/><text x="80" y="110" font-size="28" fill="#333">7-Eleven</text><path d="M60 145h280M60 185h200M60 240h250M60 280h120M60 340h280" stroke="#aca499" stroke-width="6"/><text x="180" y="420" font-size="22">¥680</text></svg>',
  );
const meta = {
  title: "Organisms/Transactions/ReceiptPhotoViewer",
  component: ReceiptPhotoViewer,
  args: {
    photos: [
      { id: "photo-1", fullUrl: receipt },
      { id: "photo-2", fullUrl: receipt },
    ],
    open: true,
    onClose: () => {},
  },
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile2" },
  },
} satisfies Meta<typeof ReceiptPhotoViewer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const TwoPhotos: Story = { name: "全屏查看与横向翻页" };
export const Loading: Story = {
  name: "列表图标点击后的加载中",
  args: { photos: [], loading: true },
};
