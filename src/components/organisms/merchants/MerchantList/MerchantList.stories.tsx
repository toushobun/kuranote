import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";

import { MerchantList } from "./MerchantList";

const merchants = [
  createMerchantRow({
    aliases: [
      createMerchantAliasRow(),
      createMerchantAliasRow({ alias: "LIFE", id: "alias-2", sort_order: 2 }),
    ],
    note: "常去的超市",
  }),
  createMerchantRow({
    id: "00000000-0000-4000-8000-000000001002",
    name: "Amazon",
    sort_order: 2,
    website_url: "https://www.amazon.co.jp",
  }),
];

const meta = {
  title: "Organisms/Merchants/MerchantList",
  component: MerchantList,
  args: {
    createHref: "/merchants/new",
    ledgerId: "ledger-1",
    merchants,
  },
} satisfies Meta<typeof MerchantList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "商家列表",
};

export const Empty: Story = {
  name: "空列表",
  args: {
    createHref: "/merchants/new",
    ledgerId: "ledger-1",
    merchants: [],
  },
};
