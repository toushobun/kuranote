import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EntryMethodDrawer } from "./EntryMethodDrawer";
import { flowFixture } from "test/mocks/transactionStepFlow";
const meta = {
  title: "Organisms/Transactions/EntryMethodDrawer",
  component: EntryMethodDrawer,
  args: {
    currentMethod: "merchant",
    open: true,
    onClose: flowFixture.onClose,
    onMethodChange: flowFixture.onMethodChange,
  },
} satisfies Meta<typeof EntryMethodDrawer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "切换方式（当前、过渡与即将推出）" };
export const TransferCurrent: Story = {
  name: "当前为账户周转",
  args: { currentMethod: "transfer" },
};
