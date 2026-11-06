import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { getLedgerSetupTemplate } from "internal/ledger";
import { buildMerchantChecklist } from "utils/merchantPresets";
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
      addedKeys: [createMerchantPresetOptions().items[0]!.key],
    },
  },
};
export const NoTemplate: Story = {
  args: {
    options: {
      region: null,
      templateVersion: null,
      groups: [],
      items: [],
      addedKeys: [],
    },
  },
};

export const Submitting: Story = {
  args: { action: () => new Promise<MerchantActionState>(() => {}) },
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      dialog.getByRole("checkbox", { name: "选择「超市」的全部商家" }),
    );
    await userEvent.click(
      dialog.getByRole("button", { name: "添加 3 个商家" }),
    );
  },
};

const template = getLedgerSetupTemplate("jp")!;
export const LegacyLedger: Story = {
  name: "旧账本",
  args: {
    options: {
      ...buildMerchantChecklist(template),
      region: null,
      addedKeys: ["don_quijote", "matsumoto_kiyoshi"],
      templateVersion: template.version,
    },
  },
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement.ownerDocument.body);
    await userEvent.click(dialog.getByRole("button", { name: "购物" }));
    await userEvent.click(dialog.getByRole("checkbox", { name: /^苹果/ }));
  },
};
