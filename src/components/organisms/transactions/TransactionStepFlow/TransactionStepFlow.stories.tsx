import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { TransactionStepFlow } from "./TransactionStepFlow";
import { flowFixture } from "./transactionStepFlowFixtures";
const meta = {
  title: "Organisms/Transactions/TransactionStepFlow",
  component: TransactionStepFlow,
  decorators: [
    (Story) => (
      <ConfirmDialogProvider>
        <Story />
      </ConfirmDialogProvider>
    ),
  ],
  args: flowFixture,
  parameters: { viewport: { defaultViewport: "mobile2" } },
} satisfies Meta<typeof TransactionStepFlow>;
export default meta;
type Story = StoryObj<typeof meta>;
export const MerchantDefault: Story = { name: "商家默认（常用不足八个）" };
export const MethodDrawer: Story = {
  name: "切换记账方式",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("button", {
        name: "切换方式",
      }),
    );
  },
};
export const EmptyMerchants: Story = {
  name: "没有商家",
  args: { merchants: [], frequentMerchants: [] },
};
export const FilteredMerchants: Story = {
  name: "商家分类筛选",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("button", {
        name: "🍴 餐饮",
      }),
    );
  },
};
export const MerchantSearch: Story = {
  name: "商家搜索",
  play: async ({ canvasElement }) => {
    await userEvent.type(
      within(canvasElement.ownerDocument.body).getByRole("textbox", {
        name: "搜索商家",
      }),
      "LIFE",
    );
  },
};
export const NoSearchResults: Story = {
  name: "搜索不到商家",
  play: async ({ canvasElement }) => {
    await userEvent.type(
      within(canvasElement.ownerDocument.body).getByRole("textbox", {
        name: "搜索商家",
      }),
      "星野咖啡",
    );
  },
};
export const RecommendedAccounts: Story = {
  name: "收支账户有推荐",
  args: {
    initialStep: 2,
    initialMerchantId: "seven",
    initialCompletedSteps: [1],
  },
};
export const NoHistory: Story = {
  name: "商家没有记录",
  args: { ...RecommendedAccounts.args, suggestions: undefined },
};
export const EmptyAccounts: Story = {
  name: "没有收支账户",
  args: { ...RecommendedAccounts.args, accounts: [] },
};
export const ReturnFromConfirmation: Story = {
  name: "从确认页返回修改",
  args: {
    initialStep: 4,
    initialMerchantId: "seven",
    initialAccountId: "paypay",
    initialCompletedSteps: [1, 2, 3],
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("button", {
        name: "账户",
      }),
    );
  },
};
export const CurrencyConfirmation: Story = {
  name: "换币种确认",
  args: { ...ReturnFromConfirmation.args, hasDetails: true },
  play: async (context) => {
    await ReturnFromConfirmation.play?.(context);
    await userEvent.click(
      within(context.canvasElement.ownerDocument.body).getByRole("radio", {
        name: "招商银行卡 CNY",
      }),
    );
  },
};
export const CloseConfirmation: Story = {
  name: "关闭确认",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("button", {
        name: "关闭记账",
      }),
    );
  },
};
