import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { TransactionEntryMethodSwitch } from "./TransactionEntryMethodSwitch";
const meta = {
  title: "Organisms/Transactions/TransactionEntryMethodSwitch",
  component: TransactionEntryMethodSwitch,
  args: { currentMethod: "transfer" },
} satisfies Meta<typeof TransactionEntryMethodSwitch>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "切换方式按钮" };
export const Opened: Story = {
  name: "打开方式选择（当前为账户周转）",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "切换方式" }),
    );
  },
};
