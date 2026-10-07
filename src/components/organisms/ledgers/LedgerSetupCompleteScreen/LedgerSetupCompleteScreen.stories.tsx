import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { LedgerSetupWizard } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupWizard";
import {
  createLedgerSetupWizardStoryActions,
  ledgerSetupWizardStoryArgs,
  ledgerSetupWizardStoryDecorators,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStoryUtils";
import { createLedgerSetupConfirmProgressFixture } from "test/mocks/ledgerSetup";

const filledProgress = createLedgerSetupConfirmProgressFixture();

const partlyEmptyProgress = createLedgerSetupConfirmProgressFixture({
  accounts: { items: [], skipped: true },
});

/**
 * 完成页的统计在完成写入时由骨架保存，因此从确认一览开始，
 * 依次点击「完成创建」与第 6 步的「完成」进入完成页。
 */
async function goToCompleteScreen(canvasElement: HTMLElement) {
  const body = within(canvasElement.ownerDocument.body);
  await userEvent.click(await body.findByRole("button", { name: "完成创建" }));
  await body.findByRole("button", { name: /^邀请成员/ });
  await userEvent.click(body.getByRole("button", { name: "完成" }));
  await body.findByRole("heading", { name: "一切就绪！" });
}

// 完成页是向导骨架中的一屏，因此在向导中展示。
const meta = {
  title: "Organisms/Ledgers/LedgerSetupCompleteScreen",
  component: LedgerSetupWizard,
  decorators: ledgerSetupWizardStoryDecorators,
  args: {
    actions: createLedgerSetupWizardStoryActions(filledProgress, {
      inviteMembers: {
        pendingInvites: [],
        placeholderMembers: [{ displayName: "奶奶", id: "placeholder-1" }],
      },
    }),
    ...ledgerSetupWizardStoryArgs,
    progress: filledProgress,
  },
  parameters: { viewport: { defaultViewport: "mobile2" } },
  play: async ({ canvasElement }) => goToCompleteScreen(canvasElement),
} satisfies Meta<typeof LedgerSetupWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllStats: Story = {
  name: "全部有数字",
};

export const PartlyZero: Story = {
  name: "部分为 0（账户已跳过、无待邀请成员）",
  args: {
    actions: createLedgerSetupWizardStoryActions(partlyEmptyProgress),
    progress: partlyEmptyProgress,
  },
};
