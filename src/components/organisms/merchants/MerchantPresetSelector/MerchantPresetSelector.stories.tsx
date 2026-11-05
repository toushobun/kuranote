import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { MerchantPresetSelectorExample } from "./merchantPresetSelectorTestUtils";

const meta = {
  title: "Organisms/Merchants/MerchantPresetSelector",
  component: MerchantPresetSelectorExample,
  parameters: { viewport: { defaultViewport: "iphone14" } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 390, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MerchantPresetSelectorExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "默认收起" };
export const Expanded: Story = {
  name: "展开购物",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "购物" }),
    );
  },
};
export const AddedChina: Story = {
  name: "追加中国",
  args: { initialAdditionalRegions: ["cn"] },
};
export const Partial: Story = {
  name: "部分选中",
  args: { initialSelectedKeys: ["apple", "starbucks"] },
};

export const CollapsedChina: Story = {
  name: "收起追加地区并保留选择",
  args: {
    initialAdditionalRegions: ["cn"],
    initialSelectedKeys: ["apple", "haidilao"],
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "收起" }),
    );
    await expect(
      within(canvasElement).getByRole("button", {
        name: "展开中国常用商家（已选 1 家）",
      }),
    ).toBeInTheDocument();
  },
};
