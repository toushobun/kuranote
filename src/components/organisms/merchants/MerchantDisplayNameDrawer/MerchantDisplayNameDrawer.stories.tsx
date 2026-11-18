import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { MerchantDisplayNameDrawer } from "./MerchantDisplayNameDrawer";

const aliases = [
  { id: "alias-1", alias: "来福" },
  { id: "alias-2", alias: "ライフ" },
];
const meta = {
  title: "Organisms/Merchants/MerchantDisplayNameDrawer",
  component: MerchantDisplayNameDrawer,
  args: {
    aliases,
    merchantName: "LIFE超市",
    onClose: () => {},
    onConfirm: () => {},
    preferredAliasId: "alias-1",
  },
  decorators: [
    (Story) => (
      <ConfirmDialogProvider>
        <Story />
      </ConfirmDialogProvider>
    ),
  ],
} satisfies Meta<typeof MerchantDisplayNameDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithAliases: Story = { name: "有别名·当前选中来福" };
export const WithoutAliases: Story = {
  name: "没有别名",
  args: { aliases: [], preferredAliasId: null },
};
export const DuplicateInput: Story = {
  name: "输入重复别名提示",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = body.getByRole("textbox", { name: "输入新的别名" });
    await userEvent.type(input, "来福");
    await userEvent.click(body.getByRole("button", { name: "添加" }));
    await expect(body.getByRole("alert")).toHaveTextContent("重复");
  },
};
export const DeleteConfirmation: Story = {
  name: "删除确认",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("button", { name: "移除别名来福" }));
    await expect(
      body.getByRole("heading", { name: "删除别名「来福」？" }),
    ).toBeInTheDocument();
  },
};
