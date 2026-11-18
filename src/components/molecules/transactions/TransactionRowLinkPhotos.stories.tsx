import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { TransactionRowItem } from "types/transactions";
import { TransactionRowLink } from "./TransactionRowLink";

const basic: TransactionRowItem = {
  id: "00000000-0000-4000-8000-000000009001",
  type: "expense",
  transaction_at: "2026-11-18T03:10:00.000Z",
  amount: "680",
  account_name: "乐天信用卡",
  account_currency: "JPY",
  categoryItems: [{ amount: "680", categoryName: "餐饮 · 午餐", parentCategoryName: "餐饮" }],
  merchant_name: "7-Eleven",
  merchant_icon_url: null,
  note: null,
};

const meta = {
  title: "Molecules/Transactions/TransactionRowLinkPhotos",
  component: TransactionRowLink,
  args: { href: "/transactions/00000000-0000-4000-8000-000000009001", item: basic },
  parameters: { viewport: { defaultViewport: "mobile2" } },
} satisfies Meta<typeof TransactionRowLink>;
export default meta;
type Story = StoryObj<typeof meta>;
export const WithoutPhoto: Story = { name: "无照片图标" };
export const WithPhoto: Story = {
  name: "照片图标独立打开预览",
  args: { item: { ...basic, attachmentCount: 2 } },
};
export const WithPhotoAndSpecialLabel: Story = {
  name: "有照片且有特殊标签",
  args: {
    item: {
      ...basic,
      attachmentCount: 2,
      categoryItems: [{
        amount: "680", categoryName: "餐饮 · 午餐", parentCategoryName: "餐饮",
        businessStatus: {
          incomeLinkRole: null,
          settlementStatus: "refunded",
          offsetComposition: { refundAmount: "180", reimbursementAmount: "0" },
        },
      }],
    },
  },
};
