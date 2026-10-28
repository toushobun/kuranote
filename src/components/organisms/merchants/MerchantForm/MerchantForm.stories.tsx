import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MerchantForm } from "./MerchantForm";

const meta = {
  title: "Organisms/Merchants/MerchantForm",
  component: MerchantForm,
  args: {
    action: async () => {},
    fetchIconAction: async () => ({}),
    ledgerId: "ledger-1",
  },
} satisfies Meta<typeof MerchantForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "新增商家表单",
};

export const PrefilledName: Story = {
  name: "从记一笔带来关键词",
  args: { initialName: "LIFE", returnTo: "/transactions/new" },
};
