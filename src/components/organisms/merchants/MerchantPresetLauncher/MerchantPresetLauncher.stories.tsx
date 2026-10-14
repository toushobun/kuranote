import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { merchantErrorMessages } from "internal/merchant";
import { createMerchantPresetOptions } from "test/mocks/merchantPresets";
import type { MerchantPresetLoadState } from "types/merchants";
import { MerchantPresetLauncher } from "./MerchantPresetLauncher";

const meta = {
  title: "Organisms/Merchants/MerchantPresetLauncher",
  component: MerchantPresetLauncher,
  args: {
    action: async () => ({}),
    loadAction: async (): Promise<MerchantPresetLoadState> => ({
      options: createMerchantPresetOptions(),
    }),
    onClose: () => {},
  },
} satisfies Meta<typeof MerchantPresetLauncher>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = {};
export const Loading: Story = {
  args: { loadAction: () => new Promise<MerchantPresetLoadState>(() => {}) },
};
export const LoadFailure: Story = {
  args: {
    loadAction: async () => ({
      error: merchantErrorMessages.merchant_preset_load_failed,
      errorKey: "load-story",
    }),
  },
};
