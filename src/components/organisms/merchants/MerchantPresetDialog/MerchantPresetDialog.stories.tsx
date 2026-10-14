import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import type { MerchantActionState } from "types/merchants";
import { createMerchantPresetOptions } from "test/mocks/merchantPresets";
import { MerchantPresetDialog } from "./MerchantPresetDialog";

const meta = {
  title: "Organisms/Merchants/MerchantPresetDialog",
  component: MerchantPresetDialog,
  args: {
    action: async () => ({}),
    onClose: () => {},
    options: createMerchantPresetOptions(),
  },
} satisfies Meta<typeof MerchantPresetDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const AlreadyAdded: Story = {
  args: {
    options: {
      ...createMerchantPresetOptions(),
      addedKeys: [createMerchantPresetOptions().template!.merchants[0]!.key],
    },
  },
};
export const NoTemplate: Story = {
  args: { options: { currency: "USD", template: null, addedKeys: [] } },
};

export const Submitting: Story = {
  args: { action: () => new Promise<MerchantActionState>(() => {}) },
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement.ownerDocument.body);
    await userEvent.click(dialog.getByRole("button", { name: "全部选择" }));
    await userEvent.click(
      dialog.getByRole("button", { name: "添加 3 个商家" }),
    );
  },
};
