import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";

import { MerchantEditTemplate } from "./MerchantEdit";

const action = async () => ({});
const meta = {
  title: "Templates/Merchants/MerchantEditTemplate",
  component: MerchantEditTemplate,
  args: {
    archiveMerchantAction: action,
    archiveMerchantAliasAction: action,
    createMerchantAliasAction: action,
    ledgerId: "ledger-1",
    ledgerName: "家庭账本",
    merchant: createMerchantRow({
      aliases: [createMerchantAliasRow({ is_preferred: true })],
      display_name: "来福",
      note: "常去的超市",
    }),
    setPreferredMerchantAliasAction: action,
    tags: [],
    updateMerchantAction: action,
  },
} satisfies Meta<typeof MerchantEditTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "编辑商家页面" };
