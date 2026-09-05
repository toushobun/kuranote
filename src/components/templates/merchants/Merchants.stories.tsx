import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

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
  {
    icon: "🍽️",
    id: "00000000-0000-4000-8000-000000002003",
    merchant_count: 4,
    name: "餐饮",
    sort_order: 2,
  },
  {
    icon: "🛋️",
    id: "00000000-0000-4000-8000-000000002004",
    merchant_count: 3,
    name: "家居",
    sort_order: 3,
  },
  {
    icon: "🧴",
    id: "00000000-0000-4000-8000-000000002005",
    merchant_count: 5,
    name: "日用",
    sort_order: 4,
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
    archiveAction: tagAction,
    createAction: tagAction,
    keyword: "",
    ledgerId: "ledger-1",
    merchants,
    selectedTag: null,
    reorderAction,
    tagFilterError: null,
    tags,
    updateAction: tagAction,
  },
} satisfies Meta<typeof MerchantsTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "商家页面" };

export const CategoryManagementExpanded: Story = {
  name: "展开分类管理",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "管理分类" }),
    );
  },
};

export const CategorySelected: Story = {
  args: {
    merchants: [merchants[1]],
    selectedTag: tags[1],
  },
  name: "已筛选分类",
};

export const WithKeyword: Story = {
  name: "带搜索词",
  args: { keyword: "便利", ledgerId: "ledger-1" },
};

export const Empty: Story = {
  name: "无商家",
  args: { ledgerId: "ledger-1", merchants: [] },
};

export const UnavailableTagFilter: Story = {
  name: "分类筛选已失效",
  args: {
    ledgerId: "ledger-1",
    merchants: [],
    tagFilterError: "该商家分类不存在或已不可用。",
  },
};
