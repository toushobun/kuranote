import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import {
  ledgerCreateErrorCodes,
  ledgerCreateErrorMessages,
} from "internal/ledger";
import { LedgerSetupWizard } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupWizard";
import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { UserThemeProvider } from "theme/UserThemeProvider";

// 第 1 步依赖向导骨架提供的步骤回调，因此在向导中展示。
const meta = {
  title: "Organisms/Ledgers/LedgerSetupBasicInfoStep",
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
    actions: { submitBasicInfo: async (state) => state },
    defaults: {
      baseCurrency: "JPY",
      displayColor: "amber",
      displayName: "DENG SONGWEN",
      ledgerName: "家庭账本",
    },
    onClose: () => {},
    open: true,
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
  name: "校验错误",
  args: {
    actions: {
      submitBasicInfo: async () => ({
        error: ledgerCreateErrorMessages[ledgerCreateErrorCodes.nameRequired],
        errorKey: "storybook-error",
      }),
    },
  },
  play: async ({ canvasElement }) => {
    await clickNext(canvasElement);
  },
};

export const Submitting: Story = {
  name: "提交中",
  args: {
    actions: { submitBasicInfo: () => new Promise(() => {}) },
  },
  play: async ({ canvasElement }) => {
    await clickNext(canvasElement);
  },
};
