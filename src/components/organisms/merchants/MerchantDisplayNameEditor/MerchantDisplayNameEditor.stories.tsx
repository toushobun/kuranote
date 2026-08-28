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
    formalName: "晨光生活超市有限公司",
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
