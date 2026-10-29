import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { TransactionStepFlow } from "../TransactionStepFlow/TransactionStepFlow";
import { transactionEntryStoryDecorators } from "organisms/transactions/transactionStepFlowStoryUtils";
import { confirmFlowFixture } from "test/mocks/transactionConfirmStep";
import {
  filledItems,
  itemsStepFixture,
  twoPayments,
} from "test/mocks/transactionItemsStep";
const meta = {
  title: "Organisms/Transactions/TransactionConfirmStep",
  component: TransactionStepFlow,
  decorators: transactionEntryStoryDecorators,
  args: confirmFlowFixture,
  parameters: { viewport: { defaultViewport: "mobile2" } },
} satisfies Meta<typeof TransactionStepFlow>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = { name: "小票（单账户、空备注）" };
export const MultiAccountWithNote: Story = {
  name: "小票（多账户 + 备注）",
  args: {
    itemsOptions: {
      ...itemsStepFixture,
      initialItems: filledItems,
      initialPayments: twoPayments,
    },
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("button", { name: /^修改备注：/ }));
    await userEvent.type(
      body.getByRole("textbox", { name: "备注" }),
      "给书房换的新键盘",
    );
    await userEvent.click(body.getByRole("button", { name: "完成" }));
  },
};
export const NoteEditor: Story = {
  name: "编辑备注",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("button", { name: /^修改备注：/ }));
    await userEvent.type(
      body.getByRole("textbox", { name: "备注" }),
      "和同事一起吃的午饭",
    );
  },
};
export const TimeEditor: Story = {
  name: "编辑时间（日期展开、时刻保留秒）",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("button", {
        name: /^修改时间：/,
      }),
    );
  },
};
export const MissingAmount: Story = {
  name: "未完成项：还有未填金额（提示、标红、禁用保存）",
  args: {
    itemsOptions: {
      ...itemsStepFixture,
      initialItems: [
        { categoryId: "lunch", amount: "498" },
        { categoryId: "coffee", amount: "" },
      ],
    },
  },
};
export const MissingRequired: Story = {
  name: "未完成项：缺少商家、账户和明细",
  args: {
    initialMerchantId: undefined,
    initialAccountId: undefined,
    itemsOptions: { categoryOptions: itemsStepFixture.categoryOptions },
  },
};
export const Unbalanced: Story = {
  name: "未完成项：多账户未对上",
  args: {
    itemsOptions: {
      ...itemsStepFixture,
      initialPayments: twoPayments,
      initialItems: [{ categoryId: "lunch", amount: "498" }],
    },
  },
};
export const SaveError: Story = {
  name: "保存失败",
  args: { action: async () => ({ error: "保存失败，请稍后重试。" }) },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("button", {
        name: "保存记账",
      }),
    );
  },
};
export const Saving: Story = {
  name: "保存中",
  args: { action: async () => new Promise(() => {}) },
  play: SaveError.play,
};
export const Abandon: Story = {
  name: "确认页关闭时确认",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("button", {
        name: "关闭记账",
      }),
    );
  },
};
