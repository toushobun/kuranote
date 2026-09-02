import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MerchantCreateTemplate } from "./MerchantCreate";

const meta = {
  title: "Templates/Merchants/MerchantCreateTemplate",
  component: MerchantCreateTemplate,
  args: {
    createMerchantAction: async () => ({}),
    ledgerId: "ledger-1",
    ledgerName: "家庭账本",
    tags: [],
  },
} satisfies Meta<typeof MerchantCreateTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "新增商家页面" };
