import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { LedgerSetupWizard } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupWizard";
import {
  createLedgerSetupWizardStoryActions,
  ledgerSetupWizardStoryArgs,
  ledgerSetupWizardStoryDecorators,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStoryUtils";
import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";
import { merchantRegionButtonName } from "organisms/merchants/MerchantPresetSelector/merchantPresetSelectorTestUtils";

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
  name: "日本优先（默认展开）",
};

export const ExpandShopping: Story = {
  name: "展开购物·订阅",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole("button", { name: "购物·订阅" }),
    );
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
  name: "日本收起、中国餐饮展开",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole("button", merchantRegionButtonName("jp")),
    );
    await userEvent.click(
      await body.findByRole("button", merchantRegionButtonName("cn")),
    );
    await userEvent.click(
      await body.findByRole("button", { name: "餐饮", expanded: false }),
    );
    await userEvent.click(
      await body.findByRole("checkbox", { name: /海底捞/ }),
    );
  },
};
export const BothCollapsed: Story = {
  name: "两组都收起",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole("button", merchantRegionButtonName("jp")),
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
