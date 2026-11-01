import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { merchantStepFixture } from "test/mocks/transactionStepFlow";
import { MerchantStep } from "./MerchantStep";
const meta = {
  title: "Organisms/Transactions/MerchantStep",
  component: MerchantStep,
  args: merchantStepFixture,
} satisfies Meta<typeof MerchantStep>;
export default meta;
type Story = StoryObj<typeof meta>;
export const MerchantDefault: Story = { name: "商家默认（常用不足八个）" };

export const LoadingMerchant: Story = {
  name: "读取建议中（被点中的商家显示加载）",
  args: { loadingMerchantId: "seven" },
};

export const EmptyMerchants: Story = {
  name: "没有商家",
  args: { merchants: [], frequentMerchants: [] },
};

export const FilteredMerchants: Story = {
  name: "商家分类筛选",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("button", {
        name: "🍴 餐饮",
      }),
    );
  },
};

export const MerchantSearch: Story = {
  name: "商家搜索",
  play: async ({ canvasElement }) => {
    await userEvent.type(
      within(canvasElement.ownerDocument.body).getByRole("textbox", {
        name: "搜索商家",
      }),
      "LIFE",
    );
  },
};

export const NoSearchResults: Story = {
  name: "搜索不到商家",
  play: async ({ canvasElement }) => {
    await userEvent.type(
      within(canvasElement.ownerDocument.body).getByRole("textbox", {
        name: "搜索商家",
      }),
      "星野咖啡",
    );
  },
};

export const WithoutCreatePermission: Story = {
  name: "无管理权限（隐藏新增入口）",
  args: { onAddMerchant: undefined },
};
