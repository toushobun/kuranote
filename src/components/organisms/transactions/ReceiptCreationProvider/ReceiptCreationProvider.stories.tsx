import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import { NewTransactionStepFlow } from "templates/transactions/NewTransactionStepFlow";
import {
  transactionEntryStoryDecorators,
  receiptCreationStoryDecorator,
} from "organisms/transactions/transactionStepFlowStoryUtils";
import { receiptItemsOptions } from "test/mocks/transactionReceipt";
import { flowFixture } from "test/mocks/transactionStepFlow";

const meta = {
  title: "Organisms/Transactions/ReceiptCreationProvider",
  component: NewTransactionStepFlow,
  decorators: [
    ...transactionEntryStoryDecorators,
    receiptCreationStoryDecorator,
  ],
  args: {
    action: async () => ({}),
    accountOptions: flowFixture.accounts,
    addPresetsAction: async () => ({}),
    categoryOptions: receiptItemsOptions.categoryOptions,
    frequentMerchants: flowFixture.frequentMerchants,
    ledgerId: "ledger-1",
    loadPresetsAction: async () => ({}),
    merchantOptions: flowFixture.merchants,
    merchantTags: flowFixture.merchantTags,
    multiAccountPaymentEnabled: true,
    transactionItemSpecialStatusEnabled: false,
  },
} satisfies Meta<typeof NewTransactionStepFlow>;
export default meta;
type Story = StoryObj<typeof meta>;
type Canvas = Parameters<NonNullable<Story["play"]>>[0];
async function openMerchant({ canvasElement }: Canvas) {
  await userEvent.click(
    within(canvasElement.ownerDocument.body).getByRole("button", {
      name: "新增商家",
    }),
  );
}
async function openAccount({ canvasElement }: Canvas) {
  const body = within(canvasElement.ownerDocument.body);
  await userEvent.click(body.getAllByRole("button", { name: /^7-Eleven/ })[0]);
  await userEvent.click(
    await body.findByRole("button", { name: "更换支付账户 1" }),
  );
  await userEvent.click(await body.findByRole("button", { name: "新增账户" }));
}
async function saveCreation(context: Canvas, kind: "merchant" | "account") {
  if (kind === "merchant") await openMerchant(context);
  else await openAccount(context);
  const body = within(context.canvasElement.ownerDocument.body);
  const field = await body.findByLabelText(
    kind === "merchant" ? /商家名称/ : /账户名称/,
  );
  await userEvent.type(field, kind === "merchant" ? "全家" : "家庭现金");
  if (kind === "account")
    await userEvent.click(body.getByRole("radio", { name: "现金" }));
  await userEvent.click(
    body.getByRole("button", {
      name: kind === "merchant" ? "保存商家" : "保存账户",
    }),
  );
  const feedback = await body.findByRole("status");
  await expect(feedback).toHaveTextContent(
    kind === "merchant"
      ? m.merchantCreated("全家")
      : m.accountCreated("家庭现金"),
  );
  await expect(feedback).toBeVisible();
  await expect(feedback.closest(".MuiSnackbar-root")?.parentElement).toBe(
    context.canvasElement.ownerDocument.body,
  );
}
export const MerchantDialog: Story = {
  name: "全屏新增商家",
  play: openMerchant,
};
export const AccountDialog: Story = {
  name: "全屏新增账户",
  play: openAccount,
};
export const MerchantSaved: Story = {
  name: "新增商家后选中",
  play: (context) => saveCreation(context, "merchant"),
};
export const AccountSaved: Story = {
  name: "新增账户后选中",
  play: (context) => saveCreation(context, "account"),
};
