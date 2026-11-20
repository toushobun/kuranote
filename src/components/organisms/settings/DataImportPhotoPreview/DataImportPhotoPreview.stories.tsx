import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DataImportPhotoPreview } from "./DataImportPhotoPreview";

const meta = {
  title: "Organisms/Settings/DataImportPhotoPreview",
  component: DataImportPhotoPreview,
  args: {
    rows: [
      {
        rowNumber: 2,
        transactionAt: "2026-11-20 10:30:00",
        merchantName: "便利店",
        amount: 1280,
        transactionType: "expense",
        photos: [
          {
            bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
            columnName: "照片1",
            mimeType: "image/jpeg" as const,
            rowNumber: 2,
          },
          {
            bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
            columnName: "照片2",
            mimeType: "image/jpeg" as const,
            rowNumber: 2,
          },
        ],
      },
    ],
  },
} satisfies Meta<typeof DataImportPhotoPreview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "照片预览（两张）" };
