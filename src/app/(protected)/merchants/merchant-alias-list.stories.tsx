import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MerchantAliasList } from "./merchant-alias-list";

const meta: Meta<typeof MerchantAliasList> = {
  component: MerchantAliasList,
  title: "Merchants/MerchantAliasList",
};

export default meta;
type Story = StoryObj<typeof MerchantAliasList>;

export const WithAliases: Story = {
  name: "有别名",
  args: {
    aliases: ["Amazon.co.jp", "アマゾン", "亚马逊"],
  },
};

export const NoAliases: Story = {
  name: "无别名",
  args: {
    aliases: [],
  },
};
