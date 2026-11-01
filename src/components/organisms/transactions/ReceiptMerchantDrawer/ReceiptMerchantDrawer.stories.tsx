import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { flowFixture } from "test/mocks/transactionStepFlow";
import { ReceiptMerchantDrawer } from "./ReceiptMerchantDrawer";

const meta = {
  title: "Organisms/Transactions/ReceiptMerchantDrawer",
  component: ReceiptMerchantDrawer,
  args: {
    open: true,
    suspended: false,
    onClose: () => {},
    onSelect: () => {},
    merchants: flowFixture.merchants,
    merchantTags: flowFixture.merchantTags,
    frequentMerchants: flowFixture.frequentMerchants,
  },
} satisfies Meta<typeof ReceiptMerchantDrawer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "选择商家" };
export const WithCreation: Story = {
  name: "有新增商家权限",
  args: { onAddMerchant: () => {} },
};
