import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type {
  MerchantTagReorderAction,
  MerchantTagStateAction,
} from "types/merchants";

import { MerchantTagManager } from "./MerchantTagManager";

const storyTagAction: MerchantTagStateAction = async () => ({});
const storyReorderAction: MerchantTagReorderAction = async () => ({});

const meta = {
  title: "Organisms/Merchants/MerchantTagManager",
  component: MerchantTagManager,
  args: {
    keyword: "",
    selectedTagId: null,
    tags: [
      {
        icon: "🛒",
        id: "tag-1",
        merchant_count: 6,
        name: "超市",
        sort_order: 0,
      },
      {
        icon: "🍽️",
        id: "tag-2",
        merchant_count: 4,
        name: "餐饮",
        sort_order: 1,
      },
      {
        icon: "📦",
        id: "tag-3",
        merchant_count: 2,
        name: "电商",
        sort_order: 2,
      },
    ],
  },
} satisfies Meta<typeof MerchantTagManager>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: meta.args, name: "内缩横向分类筛选" };

export const Selected: Story = {
  args: { ...meta.args, selectedTagId: "tag-1" },
  name: "选中分类",
};

export const Management: Story = {
  args: {
    active: true,
    archiveAction: storyTagAction,
    createAction: storyTagAction,
    mode: "management",
    reorderAction: storyReorderAction,
    tags: meta.args.tags,
    updateAction: storyTagAction,
  },
  name: "分类管理行（方形数量与宽松间距）",
};

export const DragSorting: Story = {
  ...Management,
  name: "触屏拖动与实时让位",
  parameters: {
    docs: {
      description: {
        story:
          "按住排序手柄拖动，标签跟手抬起并实时挤开其他行；松手提交。支持鼠标与触屏拖动。",
      },
    },
  },
};
