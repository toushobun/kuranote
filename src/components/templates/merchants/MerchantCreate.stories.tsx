import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MerchantCreateTemplate } from "./MerchantCreate";

const meta = {
  title: "Templates/Merchants/MerchantCreateTemplate",
  component: MerchantCreateTemplate,
  args: {
    createMerchantAction: async () => ({}),
    fetchIconAction: async () => ({
      iconUrl: "https://t2.gstatic.com/faviconV2?url=https://example.com",
      success: "网站图标已获取，保存后会缓存",
    }),
    ledgerId: "ledger-1",
    ledgerName: "家庭账本",
    tags: [],
  },
} satisfies Meta<typeof MerchantCreateTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "新增商家页面" };
