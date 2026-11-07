import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { LedgerSetupWizard } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupWizard";
import {
  createLedgerSetupWizardStoryActions,
  ledgerSetupWizardStoryArgs,
  ledgerSetupWizardStoryDecorators,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStoryUtils";

// 第 1 步依赖向导骨架提供的步骤回调，因此在向导中展示。
const meta = {
  title: "Organisms/Ledgers/LedgerSetupBasicInfoStep",
  component: LedgerSetupWizard,
  decorators: ledgerSetupWizardStoryDecorators,
  args: {
    actions: createLedgerSetupWizardStoryActions(null),
    ...ledgerSetupWizardStoryArgs,
    progress: null,
  },
  parameters: { viewport: { defaultViewport: "mobile2" } },
} satisfies Meta<typeof LedgerSetupWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

async function clickNext(canvasElement: HTMLElement) {
  const body = within(canvasElement.ownerDocument.body);
  await userEvent.click(await body.findByRole("button", { name: "下一步" }));
}

export const Default: Story = {
  name: "默认",
};

export const ValidationError: Story = {
  name: "本地校验错误",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.clear(
      await body.findByRole("textbox", { name: "账本名称" }),
    );
    await clickNext(canvasElement);
  },
};

export const LocalStepChange: Story = {
  name: "纯本地下一步",
  play: async ({ canvasElement }) => {
    await clickNext(canvasElement);
  },
};
