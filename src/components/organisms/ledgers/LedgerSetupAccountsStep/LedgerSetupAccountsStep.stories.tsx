import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { getLedgerSetupTemplate } from "internal/ledger";
import { LedgerSetupWizard } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupWizard";
import {
  createLedgerSetupWizardStoryActions,
  ledgerSetupWizardStoryArgs,
  ledgerSetupWizardStoryDecorators,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStoryUtils";
import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";

// 账户候选数量影响画面高度与上限提示，因此使用真实模板。
const template = getLedgerSetupTemplate("jp")!;

const defaultProgress = createLedgerSetupProgressFixture({}, template);

const multipleAccountsProgress = createLedgerSetupProgressFixture(
  {
    draft: {
      ...defaultProgress.setup.draft,
      accounts: {
        items: [
          { name: "日元现金", templateKey: "日元现金", type: "cash" },
          { name: "三菱UFJ銀行", templateKey: "三菱UFJ銀行", type: "bank" },
          { name: "楽天銀行", templateKey: "楽天銀行", type: "bank" },
          {
            name: "楽天カード",
            templateKey: "楽天カード",
            type: "credit_card",
          },
          { name: "PayPay", templateKey: "PayPay", type: "e_money" },
          { name: "支付宝", templateKey: "支付宝", type: "e_money" },
        ],
        skipped: false,
      },
    },
  },
  template,
);

const chinaProgress = createLedgerSetupProgressFixture(
  {
    draft: {
      ...defaultProgress.setup.draft,
      accounts: {
        items: [
          { name: "人民币现金", templateKey: "人民币现金", type: "cash" },
        ],
        skipped: false,
      },
      templateRegion: "cn",
    },
    livingRegion: "cn",
  },
  getLedgerSetupTemplate("cn"),
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
  name: "默认（只勾选生活地区的现金）",
};

export const MultipleAccounts: Story = {
  name: "多个账户（含另一地区，展开银行卡）",
  args: {
    actions: createLedgerSetupWizardStoryActions(multipleAccountsProgress),
    progress: multipleAccountsProgress,
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const [bank] = await body.findAllByRole("button", { name: "银行卡" });
    await userEvent.click(bank!);
  },
};

export const ChinaRegion: Story = {
  name: "生活地区为中国",
  args: {
    actions: createLedgerSetupWizardStoryActions(chinaProgress),
    progress: chinaProgress,
  },
};

export const LimitExceeded: Story = {
  name: "超过账户上限",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole("button", { name: "中国常用账户" }),
    );
    for (const checkbox of await body.findAllByRole("checkbox", {
      name: /^选择「.+」的全部账户$/,
    })) {
      if (!(checkbox as HTMLInputElement).checked) {
        await userEvent.click(checkbox);
      }
    }
  },
};

export const LocalStepChange: Story = {
  name: "纯本地切换步骤",
  args: {
    actions: {
      ...createLedgerSetupWizardStoryActions(defaultProgress),
      persistSetup: async () => ({ error: "仅在显式保存或完成时写入" }),
    },
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", { name: /^下一步/ }));
  },
};
