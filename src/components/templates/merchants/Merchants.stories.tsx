import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";

import { MerchantsTemplate } from "./Merchants";

const tagAction = async () => ({});
const reorderAction = async () => ({});
const tags = [
  {
    icon: "🛒",
    id: "00000000-0000-4000-8000-000000002001",
    merchant_count: 1,
    name: "超市",
    sort_order: 0,
  },
  {
    icon: "📦",
    id: "00000000-0000-4000-8000-000000002002",
    merchant_count: 1,
    name: "电商",
    sort_order: 1,
  },
];

const merchants = [
  createMerchantRow({
    aliases: [createMerchantAliasRow({ is_preferred: true })],
    display_name: "来福",
    note: "常去的超市",
    tags: [tags[0]],
  }),
  createMerchantRow({
    display_name: "Amazon",
    id: "00000000-0000-4000-8000-000000001002",
    name: "Amazon",
    website_url: "https://www.amazon.co.jp",
    tags: [tags[1]],
  }),
];

const meta = {
  title: "Templates/Merchants/MerchantsTemplate",
  component: MerchantsTemplate,
  args: {
    archiveMerchantTagAction: tagAction,
    createMerchantTagAction: tagAction,
    keyword: "",
    ledgerId: "ledger-1",
    merchants,
    reorderMerchantTagsAction: reorderAction,
    selectedTag: null,
    tags,
    updateMerchantTagAction: tagAction,
  },
} satisfies Meta<typeof MerchantsTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "商家页面" };

export const WithKeyword: Story = {
  name: "带搜索词",
  args: { keyword: "便利", ledgerId: "ledger-1" },
};

export const Empty: Story = {
  name: "无商家",
  args: { ledgerId: "ledger-1", merchants: [] },
};
