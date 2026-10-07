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
  ledgerSetupTemplateFixture,
} from "test/mocks/ledgerSetup";

const defaultProgress = createLedgerSetupProgressFixture(
  {},
  ledgerSetupTemplateFixture,
);

const multipleAccountsProgress = createLedgerSetupProgressFixture(
  {
    draft: {
      ...defaultProgress.setup.draft,
      accounts: {
        items: [
          { name: "现金", type: "cash" },
          { name: "三菱UFJ銀行", templateKey: "三菱UFJ銀行", type: "bank" },
          { name: "楽天銀行", templateKey: "楽天銀行", type: "bank" },
          {
            name: "楽天カード",
            templateKey: "楽天カード",
            type: "credit_card",
          },
          { name: "PayPay", templateKey: "PayPay", type: "e_money" },
          { name: "Suica", templateKey: "Suica", type: "e_money" },
        ],
        skipped: false,
      },
    },
  },
  ledgerSetupTemplateFixture,
);

// 第 2 步依赖向导骨架提供的步骤回调与进度，因此在向导中展示。
const meta = {
  title: "Organisms/Ledgers/LedgerSetupAccountsStep",
  component: LedgerSetupWizard,
  decorators: ledgerSetupWizardStoryDecorators,
  args: {
    actions: createLedgerSetupWizardStoryActions(defaultProgress),
    ...ledgerSetupWizardStoryArgs,
    progress: defaultProgress,
  },
  parameters: { viewport: { defaultViewport: "mobile2" } },
} satisfies Meta<typeof LedgerSetupWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "默认（只有现金）",
};

export const MultipleAccounts: Story = {
  name: "多个账户（含已取消勾选）",
  args: {
    actions: createLedgerSetupWizardStoryActions(multipleAccountsProgress),
    progress: multipleAccountsProgress,
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole("checkbox", { name: "楽天銀行" }),
    );
  },
};

export const WithoutTemplate: Story = {
  name: "无模板币种",
  args: {
    progress: createLedgerSetupProgressFixture({ baseCurrency: "USD" }),
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole("button", { name: "添加银行卡" }),
    );
  },
};

export const Saving: Story = {
  name: "保存中",
  args: {
    actions: {
      ...createLedgerSetupWizardStoryActions(defaultProgress),
      saveDraft: () => new Promise(() => {}),
    },
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", { name: /^下一步/ }));
  },
};
