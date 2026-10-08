import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { LedgerSetupWizard } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupWizard";
import {
  createLedgerSetupWizardStoryActions,
  ledgerSetupWizardStoryArgs,
  ledgerSetupWizardStoryDecorators,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStoryUtils";
import {
  createLedgerSetupProgressFixture,
  ledgerSetupMerchantDefaultSelectedKeys,
  ledgerSetupMerchantTemplateFixture,
} from "test/mocks/ledgerSetup";

const base = createLedgerSetupProgressFixture();

const filledProgress = createLedgerSetupProgressFixture(
  {
    draft: {
      ...base.setup.draft,
      accounts: {
        items: [
          { name: "现金", type: "cash" },
          { name: "三菱UFJ銀行", templateKey: "三菱UFJ銀行", type: "bank" },
          {
            name: "楽天カード",
            templateKey: "楽天カード",
            type: "credit_card",
          },
          { name: "PayPay", templateKey: "PayPay", type: "e_money" },
        ],
        skipped: false,
      },
      features: { specialStatusEnabled: true },
      merchants: {
        selectedKeys: [...ledgerSetupMerchantDefaultSelectedKeys, "apple"],
        skipped: false,
      },
    },
    displayName: "DENG SONGWEN",
    step: 5,
  },
  ledgerSetupMerchantTemplateFixture,
);

const skippedProgress = createLedgerSetupProgressFixture(
  {
    draft: {
      ...base.setup.draft,
      accounts: { items: [{ name: "现金", type: "cash" }], skipped: true },
      merchants: { selectedKeys: [], skipped: false },
    },
    displayName: "DENG SONGWEN",
    step: 5,
  },
  ledgerSetupMerchantTemplateFixture,
);

// 第 5 步依赖向导骨架提供的步骤回调与进度，因此在向导中展示。
const meta = {
  title: "Organisms/Ledgers/LedgerSetupConfirmStep",
  component: LedgerSetupWizard,
  decorators: ledgerSetupWizardStoryDecorators,
  args: {
    actions: createLedgerSetupWizardStoryActions(filledProgress),
    ...ledgerSetupWizardStoryArgs,
    progress: filledProgress,
  },
  parameters: { viewport: { defaultViewport: "mobile2" } },
} satisfies Meta<typeof LedgerSetupWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "全部有内容",
};

export const CategoriesExpanded: Story = {
  name: "分类展开",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole("button", { name: "展开全部 12 个分类" }),
    );
  },
};

export const Skipped: Story = {
  name: "账户与商家已跳过",
  args: { progress: skippedProgress },
};

export const Submitting: Story = {
  name: "提交中",
  args: {
    actions: {
      ...createLedgerSetupWizardStoryActions(filledProgress),
      abandonSetup: async () => ({}),
      completeSetup: () => new Promise(() => {}),
    },
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole("button", { name: "完成创建" }),
    );
  },
};
