import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import {
  receiptCreationStoryDecorator,
  transactionEntryStoryDecorators,
} from "organisms/transactions/transactionStepFlowStoryUtils";
import { accountWebsiteIconFixture } from "test/mocks/accounts";
import { flowFixture } from "test/mocks/transactionStepFlow";

import { TransferReceipt } from "./TransferReceipt";

const editValues = {
  accountId: "bank",
  note: "取现",
  transactionAt: "2026-06-05T03:20:10.000Z",
  transactionRecordId: "record-1",
  transferAmount: "5000",
  transferTargetAccountId: "cash",
  type: "transfer" as const,
};

const meta = {
  title: "Organisms/Transactions/TransferReceipt",
  component: TransferReceipt,
  decorators: [
    ...transactionEntryStoryDecorators,
    receiptCreationStoryDecorator,
    (Story) => (
      <Box sx={{ p: 2.5, maxWidth: 480 }}>
        <Story />
      </Box>
    ),
  ],
  args: {
    formId: "transfer-receipt",
    action: () => {},
    accountOptions: flowFixture.accounts,
  },
  parameters: { viewport: { defaultViewport: "mobile2" } },
} satisfies Meta<typeof TransferReceipt>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { name: "新增：刚打开" };

export const Filled: Story = {
  name: "已填写（账户文字图标）",
  args: { initialValues: { ...editValues, accountId: "paypay" } },
};

export const InvalidAfterSave: Story = {
  name: "点保存后标红未完成的项目",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "保存转账" }),
    );
    await expect(
      await within(canvasElement).findByText("请选择转出账户"),
    ).toBeInTheDocument();
  },
};

export const Edit: Story = {
  name: "编辑转账",
  args: { initialValues: editValues, sourceType: "transfer" },
};

export const ReadOnly: Story = {
  name: "只读详情",
  args: { initialValues: editValues, readOnly: true },
};

export const WebsiteIcon: Story = {
  name: "带网站图标的转账和账户抽屉",
  args: {
    initialValues: editValues,
    accountOptions: flowFixture.accounts.map((account) =>
      account.id === "bank"
        ? { ...account, icon_url: accountWebsiteIconFixture.icon_url }
        : account,
    ),
  },
};
