import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";

import { LedgerSetupWizard } from "./LedgerSetupWizard";
import {
  createLedgerSetupWizardStoryActions,
  ledgerSetupWizardStoryArgs,
  ledgerSetupWizardStoryDecorators,
} from "./ledgerSetupWizardStoryUtils";

const setupProgress = createLedgerSetupProgressFixture({
  displayName: "DENG SONGWEN",
});

const meta = {
  title: "Organisms/Ledgers/LedgerSetupWizard",
  component: LedgerSetupWizard,
  decorators: ledgerSetupWizardStoryDecorators,
  args: {
    actions: createLedgerSetupWizardStoryActions(setupProgress),
    ...ledgerSetupWizardStoryArgs,
    progress: null,
  },
} satisfies Meta<typeof LedgerSetupWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
  name: "移动端（全屏）",
  parameters: { viewport: { defaultViewport: "mobile2" } },
};

export const Desktop: Story = {
  name: "桌面端（居中弹框）",
};

export const ResumeAccountsStep: Story = {
  name: "恢复到第 2 步（账户）",
  args: { progress: setupProgress },
  parameters: { viewport: { defaultViewport: "mobile2" } },
};

export const CloseConfirm: Story = {
  name: "关闭确认（已创建账本）",
  args: { progress: setupProgress },
  parameters: { viewport: { defaultViewport: "mobile2" } },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole("button", { name: "关闭创建账本向导" }),
    );
  },
};
