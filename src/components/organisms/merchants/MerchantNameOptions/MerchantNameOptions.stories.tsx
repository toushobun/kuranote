import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";
import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";

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
  decorators: [
    (Story) => (
      <ConfirmDialogProvider>
        <Story />
      </ConfirmDialogProvider>
    ),
  ],
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

export const DeleteConfirmation: Story = {
  name: "删除别名前确认",
  args: {
    archiveAliasAction: async () => {},
    variant: "rows",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole("button", { name: "移除别名来福" }));

    await expect(
      body.getByRole("heading", { name: "删除别名？" }),
    ).toBeInTheDocument();
    await expect(body.getByText(/确认删除别名“来福”/)).toBeInTheDocument();
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
