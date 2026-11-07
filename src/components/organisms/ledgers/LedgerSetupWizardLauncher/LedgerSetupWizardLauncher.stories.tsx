import Button from "@mui/material/Button";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { ledgerSetupEntryMessages } from "config/ledgerSetupMessages";
import {
  createLedgerSetupWizardLauncherStoryActions,
  ledgerSetupWizardStoryDecorators,
  ledgerSetupRestartStoryProgress,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStoryUtils";

import { LedgerSetupWizardLauncher } from "./LedgerSetupWizardLauncher";
import { useLedgerSetupWizardLauncher } from "./useLedgerSetupWizardLauncher";

const actions = createLedgerSetupWizardLauncherStoryActions(
  ledgerSetupRestartStoryProgress,
);

function CreateEntry() {
  const launcher = useLedgerSetupWizardLauncher(actions);
  return (
    <>
      <Button onClick={() => launcher.openWizard("create")}>创建账本</Button>
      <LedgerSetupWizardLauncher launcher={launcher} />
    </>
  );
}

const meta = {
  title: "Organisms/Ledgers/LedgerSetupWizardLauncher",
  component: CreateEntry,
  decorators: ledgerSetupWizardStoryDecorators,
} satisfies Meta<typeof CreateEntry>;

export default meta;
type Story = StoryObj<typeof meta>;

async function openDraft(canvasElement: HTMLElement) {
  await userEvent.click(
    within(canvasElement).getByRole("button", { name: "创建账本" }),
  );
  return within(canvasElement.ownerDocument.body).findByRole("button", {
    name: ledgerSetupEntryMessages.restart,
  });
}

export const ExistingDraft: Story = {
  name: "已有草稿（从创建入口打开）",
  play: async ({ canvasElement }) => {
    await openDraft(canvasElement);
  },
};

export const RestartConfirmation: Story = {
  name: "重新创建确认中",
  play: async ({ canvasElement }) => {
    await userEvent.click(await openDraft(canvasElement));
  },
};
