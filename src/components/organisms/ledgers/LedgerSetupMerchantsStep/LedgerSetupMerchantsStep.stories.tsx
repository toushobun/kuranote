import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { LedgerSetupWizard } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupWizard";
import {
  createLedgerSetupWizardStoryActions,
  ledgerSetupWizardStoryArgs,
  ledgerSetupWizardStoryDecorators,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStoryUtils";
import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";

import {
  createDefaultLedgerSetupDraft,
  getLedgerSetupTemplate,
  type LedgerSetupRegion,
} from "internal/ledger";
function createMerchantsProgress(
  livingRegion: LedgerSetupRegion = "jp",
  selectedKeys?: string[],
) {
  const template = getLedgerSetupTemplate(livingRegion)!;
  const draft = createDefaultLedgerSetupDraft(livingRegion, template);
  const base = createLedgerSetupProgressFixture();
  return createLedgerSetupProgressFixture(
    {
      livingRegion,
      draft: {
        ...base.setup.draft,
        merchants: {
          selectedKeys: selectedKeys ?? draft.merchants.selectedKeys,
          skipped: false,
        },
      },
      step: 3,
    },
    template,
  );
}

const defaultProgress = createMerchantsProgress();

// 第 3 步依赖向导骨架提供的步骤回调与进度，因此在向导中展示。
const meta = {
  title: "Organisms/Ledgers/LedgerSetupMerchantsStep",
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
  name: "默认（收起）",
};

export const ExpandShopping: Story = {
  name: "展开购物",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", { name: "购物" }));
  },
};

export const SelectNone: Story = {
  name: "全不选",
  args: { progress: createMerchantsProgress("jp", []) },
};

export const ChinaFirst: Story = {
  name: "中国优先",
  args: { progress: createMerchantsProgress("cn") },
};
export const AddedChina: Story = {
  name: "展开中国",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole("button", { name: /中国常用商家/ }),
    );
  },
};
export const Partial: Story = {
  name: "部分选中",
  args: {
    progress: createMerchantsProgress(
      "jp",
      defaultProgress.setup.draft.merchants.selectedKeys.filter(
        (key) => key !== "apple",
      ),
    ),
  },
};
export const DifferentCurrency: Story = {
  name: "人民币账本使用日本地区",
  args: {
    progress: {
      ...defaultProgress,
      setup: { ...defaultProgress.setup, baseCurrency: "CNY" },
    },
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
