import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MerchantAddSheet } from "./MerchantAddSheet";
const meta = {
  title: "Organisms/Merchants/MerchantAddSheet",
  component: MerchantAddSheet,
  args: { open: true, onClose: () => {}, onPreset: () => {} },
} satisfies Meta<typeof MerchantAddSheet>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
