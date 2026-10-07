import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { LedgerSetupWizard } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupWizard";
import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import {
  createLedgerSetupProgressFixture,
  ledgerSetupTemplateFixture,
} from "test/mocks/ledgerSetup";
import { UserThemeProvider } from "theme/UserThemeProvider";
import type { LedgerSetupProgress } from "types/ledgers";

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

function createActions(progress: LedgerSetupProgress) {
  return {
    saveDraft: async () => ({ progress }),
    submitBasicInfo: async () => ({ progress }),
  };
}

// 第 2 步依赖向导骨架提供的步骤回调与进度，因此在向导中展示。
const meta = {
  title: "Organisms/Ledgers/LedgerSetupAccountsStep",
  component: LedgerSetupWizard,
  decorators: [
    (Story) => (
      <UserThemeProvider>
        <ConfirmDialogProvider>
          <Story />
        </ConfirmDialogProvider>
      </UserThemeProvider>
    ),
  ],
  args: {
    actions: createActions(defaultProgress),
    defaults: {
      baseCurrency: "JPY",
      displayColor: "amber",
      displayName: "DENG SONGWEN",
      ledgerName: "家庭账本",
    },
    onClose: () => {},
    open: true,
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
    actions: createActions(multipleAccountsProgress),
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
      ...createActions(defaultProgress),
      saveDraft: () => new Promise(() => {}),
    },
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", { name: /^下一步/ }));
  },
};
