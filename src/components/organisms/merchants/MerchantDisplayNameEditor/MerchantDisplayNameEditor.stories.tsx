import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";

import { MerchantDisplayNameEditor } from "./MerchantDisplayNameEditor";

const meta = {
  title: "Organisms/Merchants/MerchantDisplayNameEditor",
  component: MerchantDisplayNameEditor,
  args: {
    archiveAliasAction: async () => {},
    createAliasAction: async () => {},
    merchant: createMerchantRow({
      aliases: [
        createMerchantAliasRow({ alias: "晨光生活", is_preferred: true }),
        createMerchantAliasRow({ alias: "晨光", id: "alias-2" }),
      ],
      display_name: "晨光生活",
      name: "晨光生活超市有限公司",
    }),
    setPreferredAliasAction: async () => {},
  },
} satisfies Meta<typeof MerchantDisplayNameEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "显示名与别名管理" };

export const FormalNameSelected: Story = {
  name: "正式名为当前展示名",
  args: {
    merchant: createMerchantRow({
      aliases: [],
      display_name: "晨光生活超市有限公司",
      name: "晨光生活超市有限公司",
    }),
  },
};
