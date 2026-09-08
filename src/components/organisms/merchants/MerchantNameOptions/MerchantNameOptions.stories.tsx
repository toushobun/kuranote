import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";

import { MerchantNameOptions } from "./MerchantNameOptions";

const merchant = createMerchantRow({
  aliases: [
    createMerchantAliasRow({ is_preferred: true }),
    createMerchantAliasRow({ alias: "LIFE", id: "alias-2" }),
  ],
  display_name: "来福",
});

const meta = {
  title: "Organisms/Merchants/MerchantNameOptions",
  component: MerchantNameOptions,
  args: {
    merchant,
    setPreferredAliasAction: async () => {},
  },
} satisfies Meta<typeof MerchantNameOptions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Chips: Story = {
  name: "列表页名称选项",
};

export const Rows: Story = {
  name: "编辑页整行选择",
  args: {
    archiveAliasAction: async () => {},
    variant: "rows",
  },
};

export const FormalNameSelected: Story = {
  name: "正式名为当前显示名",
  args: {
    merchant: {
      ...merchant,
      aliases: merchant.aliases.map((alias) => ({
        ...alias,
        is_preferred: false,
      })),
      display_name: merchant.name,
    },
  },
};

export const Pending: Story = {
  name: "切换处理中",
  args: {
    pending: true,
  },
};
