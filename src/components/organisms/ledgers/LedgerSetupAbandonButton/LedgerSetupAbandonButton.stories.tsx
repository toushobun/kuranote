import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { ledgerSetupWizardStoryDecorators } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStoryUtils";
import { LedgerSetupAbandonButton } from "./LedgerSetupAbandonButton";
const meta = {
  title: "Organisms/Ledgers/LedgerSetupAbandonButton",
  component: LedgerSetupAbandonButton,
  decorators: ledgerSetupWizardStoryDecorators,
  args: {
    action: async () => ({}),
    ledgerId: "ledger",
    ledgerName: "我们家",
    onSuccess: () => {},
  },
} satisfies Meta<typeof LedgerSetupAbandonButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "放弃创建入口" };
export const Confirm: Story = {
  name: "危险确认",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "放弃创建" }),
    );
  },
};
export const Pending: Story = {
  name: "处理中",
  args: { action: () => new Promise(() => {}) },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "放弃创建" }),
    );
    const dialog = await within(canvasElement.ownerDocument.body).findByRole(
      "dialog",
      { name: "放弃创建「我们家」？" },
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "放弃创建" }),
    );
  },
};
export const Failure: Story = {
  ...Pending,
  name: "放弃失败",
  args: {
    action: async () => ({
      error: "该账本已有其他成员或邀请，无法放弃创建。",
      errorKey: "story",
    }),
  },
};
