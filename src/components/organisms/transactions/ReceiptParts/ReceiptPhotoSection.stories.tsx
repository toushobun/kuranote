import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Box from "@mui/material/Box";
import type {
  ReceiptPhotoController,
  ReceiptPhotoEntry,
} from "./useReceiptPhotos";
import { ReceiptPhotoSection } from "./ReceiptPhotoSection";

const receiptPreview =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="240"><rect width="180" height="240" fill="#f5f0e8"/><text x="28" y="50" font-size="18" fill="#453b31">7-Eleven</text><path d="M22 68h136M22 93h118M22 120h136M22 145h90M22 176h136" stroke="#b1a69a" stroke-width="4"/></svg>',
  );

function example(
  index: number,
  status: ReceiptPhotoEntry["status"] = "uploaded",
): ReceiptPhotoEntry {
  return {
    attachmentId:
      status === "uploaded"
        ? `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`
        : undefined,
    fullUrl: receiptPreview,
    key: `receipt-${index}`,
    previewUrl: receiptPreview,
    source: "saved",
    status,
  };
}

function photoState(
  photos: ReceiptPhotoEntry[],
  error: string | null = null,
): ReceiptPhotoController {
  return {
    photos,
    error,
    loading: false,
    touched: false,
    savingPhotos: false,
    addFiles: () => {},
    remove: () => {},
    retry: () => {},
    prepareForSave: async () => true,
  };
}

const meta = {
  title: "Organisms/Transactions/ReceiptPhotoSection",
  component: ReceiptPhotoSection,
  decorators: [
    (Story) => (
      <Box sx={{ bgcolor: "#fffdf8", maxWidth: 390, p: 2 }}>
        <Story />
      </Box>
    ),
  ],
  args: { controller: photoState([]) },
  parameters: { viewport: { defaultViewport: "mobile2" } },
} satisfies Meta<typeof ReceiptPhotoSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { name: "尚无照片" };
export const WithPhotos: Story = {
  name: "已添加两张照片",
  args: { controller: photoState([example(0), example(1)]) },
};
export const Uploading: Story = {
  name: "上传中的遮罩",
  args: { controller: photoState([example(0), example(1, "uploading")]) },
};
export const FailedRetry: Story = {
  name: "上传失败与重试",
  args: {
    controller: photoState(
      [example(0), example(1, "failed")],
      "1 张照片上传失败，请重试或移除",
    ),
  },
};
export const Full: Story = {
  name: "已满五张",
  args: {
    controller: photoState(
      Array.from({ length: 5 }, (_, index) => example(index)),
    ),
  },
};
export const ReadOnly: Story = {
  name: "详情只读缩略图",
  args: { controller: photoState([example(0), example(1)]), readOnly: true },
};
