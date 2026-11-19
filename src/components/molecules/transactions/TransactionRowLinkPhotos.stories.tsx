import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { mocked } from "storybook/test";
import { loadReceiptPhotos } from "utils/transactionAttachmentClient";
import type { ReceiptPhotoPreview } from "organisms/transactions/ReceiptParts/ReceiptPhotoViewer";
import { mocked } from "storybook/test";
import { loadReceiptPhotos } from "utils/transactionAttachmentClient";
import type { ReceiptPhotoPreview } from "organisms/transactions/ReceiptParts/ReceiptPhotoViewer";
import { TransactionRowLink } from "./TransactionRowLink";

const basic: TransactionRowItem = {
  id: "00000000-0000-4000-8000-000000009001",
  type: "expense",
  transaction_at: "2026-11-18T03:10:00.000Z",
  amount: "680",
  account_name: "乐天信用卡",
  account_currency: "JPY",
  categoryItems: [
    { amount: "680", categoryName: "餐饮 · 午餐", parentCategoryName: "餐饮" },
  ],
  merchant_name: "7-Eleven",
  merchant_icon_url: null,
  note: null,
};

const withPhotos = {
  ...basic,
  attachmentCount: 2,
  attachmentLedgerId: "00000000-0000-4000-8000-000000009002",
};

const receipt =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="650"><rect width="400" height="650" fill="#f3eee5"/><text x="80" y="110" font-size="28" fill="#333">7-Eleven</text><path d="M60 145h280M60 185h200M60 240h250M60 280h120M60 340h280" stroke="#aca499" stroke-width="6"/><text x="180" y="420" font-size="22">¥680</text></svg>',
  );

const receipt =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="650"><rect width="400" height="650" fill="#f3eee5"/><text x="80" y="110" font-size="28" fill="#333">7-Eleven</text><path d="M60 145h280M60 185h200M60 240h250M60 280h120M60 340h280" stroke="#aca499" stroke-width="6"/><text x="180" y="420" font-size="22">¥680</text></svg>',
  );

const photos: ReceiptPhotoPreview[] = [
  { id: "photo-1", fullUrl: receipt, thumbnailUrl: receipt },
  { id: "photo-2", fullUrl: receipt, thumbnailUrl: receipt },
];

const photos: ReceiptPhotoPreview[] = [
  { id: "photo-1", fullUrl: receipt, thumbnailUrl: receipt },
  { id: "photo-2", fullUrl: receipt, thumbnailUrl: receipt },
];

const meta = {
  beforeEach() {
    mocked(loadReceiptPhotos).mockResolvedValue(photos);
  },
  title: "Molecules/Transactions/TransactionRowLinkPhotos",
  component: TransactionRowLink,
  beforeEach() {
    mocked(loadReceiptPhotos).mockResolvedValue(photos);
  },
  args: {
    href: "/transactions/00000000-0000-4000-8000-000000009001",
    item: basic,
  },
  parameters: { viewport: { defaultViewport: "mobile2" } },
} satisfies Meta<typeof TransactionRowLink>;
export default meta;
type Story = StoryObj<typeof meta>;
export const WithoutPhoto: Story = { name: "无照片图标" };
export const WithPhoto: Story = {
  name: "照片图标独立打开预览",
  args: { item: withPhotos },
};
export const WithPhotoAndSpecialLabel: Story = {
  name: "有照片且有特殊标签",
  args: {
    item: {
      ...withPhotos,
      categoryItems: [
        {
          amount: "680",
          categoryName: "餐饮 · 午餐",
          parentCategoryName: "餐饮",
          businessStatus: {
            incomeLinkRole: null,
            settlementStatus: "reimbursed",
            offsetComposition: {
              refundAmount: "180",
              reimbursementAmount: "0",
            },
          },
        },
      ],
    },
  },
};
