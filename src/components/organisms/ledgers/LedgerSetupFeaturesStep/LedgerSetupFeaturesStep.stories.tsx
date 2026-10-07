import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LedgerSetupWizard } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupWizard";
import {
  createLedgerSetupWizardStoryActions,
  ledgerSetupWizardStoryArgs,
  ledgerSetupWizardStoryDecorators,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStoryUtils";
import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";

function createFeaturesProgress(specialStatusEnabled: boolean) {
  const base = createLedgerSetupProgressFixture();
  return createLedgerSetupProgressFixture({
    draft: { ...base.setup.draft, features: { specialStatusEnabled } },
    step: 4,
  });
}

const disabledProgress = createFeaturesProgress(false);

// 第 4 步依赖向导骨架提供的步骤回调与进度，因此在向导中展示。
const meta = {
  title: "Organisms/Ledgers/LedgerSetupFeaturesStep",
  component: LedgerSetupWizard,
  decorators: ledgerSetupWizardStoryDecorators,
  args: {
    actions: createLedgerSetupWizardStoryActions(disabledProgress),
    ...ledgerSetupWizardStoryArgs,
    progress: disabledProgress,
  },
  parameters: { viewport: { defaultViewport: "mobile2" } },
} satisfies Meta<typeof LedgerSetupWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "默认（未开启）",
};

export const Enabled: Story = {
  name: "已开启",
  args: { progress: createFeaturesProgress(true) },
};
