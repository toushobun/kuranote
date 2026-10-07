import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { LedgerSetupWizard } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupWizard";
import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import {
  createLedgerSetupProgressFixture,
  ledgerSetupMerchantDefaultSelectedKeys,
  ledgerSetupMerchantTemplateFixture,
} from "test/mocks/ledgerSetup";
import { UserThemeProvider } from "theme/UserThemeProvider";
import type { LedgerSetupProgress } from "types/ledgers";

function createMerchantsProgress(selectedKeys: string[]) {
  const base = createLedgerSetupProgressFixture();
  return createLedgerSetupProgressFixture(
    {
      draft: {
        ...base.setup.draft,
        merchants: { selectedKeys, skipped: false },
      },
      step: 3,
    },
    ledgerSetupMerchantTemplateFixture,
  );
}

const defaultProgress = createMerchantsProgress(
  ledgerSetupMerchantDefaultSelectedKeys,
);

function createActions(progress: LedgerSetupProgress) {
  return {
    saveDraft: async () => ({ progress }),
    submitBasicInfo: async () => ({ progress }),
  };
}

// 第 3 步依赖向导骨架提供的步骤回调与进度，因此在向导中展示。
const meta = {
  title: "Organisms/Ledgers/LedgerSetupMerchantsStep",
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
  name: "默认（收起）",
};

export const ExpandRestaurant: Story = {
  name: "展开餐饮",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", { name: "餐饮" }));
  },
};

export const SelectNone: Story = {
  name: "全不选",
  args: { progress: createMerchantsProgress([]) },
};

export const WithoutTemplate: Story = {
  name: "无模板币种",
  args: {
    progress: createLedgerSetupProgressFixture({
      baseCurrency: "USD",
      step: 3,
    }),
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
