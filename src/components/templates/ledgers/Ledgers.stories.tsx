import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  currentLedgerErrorCodes,
  currentLedgerErrorMessages,
  type LedgerWithMemberCount,
} from "internal/ledger";
import {
  createLedgerSetupWizardLauncherStoryActions,
  ledgerSetupWizardStoryDecorators,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStoryUtils";
import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";

import { LedgersTemplate } from "./Ledgers";

const ledgers: LedgerWithMemberCount[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "家庭账本",
    baseCurrency: "JPY",
    currentUserRole: "owner",
    memberCount: 2,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "旅行账本",
    baseCurrency: "JPY",
    currentUserRole: "admin",
    memberCount: 1,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "育儿账本",
    baseCurrency: "JPY",
    currentUserRole: "member",
    memberCount: 2,
  },
];

const setupProgress = createLedgerSetupProgressFixture({
  name: "爸妈账本",
  step: 2,
});

const meta = {
  title: "Templates/Ledgers/LedgersTemplate",
  component: LedgersTemplate,
  args: {
    currentLedgerId: "00000000-0000-4000-8000-000000000001",
    errorMessage: null,
    ledgers,
    setupWizardActions: createLedgerSetupWizardLauncherStoryActions(),
    switchResult: null,
    updateCurrentLedgerAction: async () => {},
  },
  // 「新增账本」「继续创建」可以打开创建账本向导。
  decorators: ledgerSetupWizardStoryDecorators,
} satisfies Meta<typeof LedgersTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "账本管理页",
};

export const SetupInProgress: Story = {
  name: "有创建中账本",
  args: {
    setupInProgress: {
      id: "00000000-0000-4000-8000-000000000001",
      name: setupProgress.setup.name,
      step: setupProgress.setup.step,
    },
    // 「新增账本」与「继续创建」都打开该账本的向导并提示。
    setupWizardActions:
      createLedgerSetupWizardLauncherStoryActions(setupProgress),
  },
};

export const SetupInProgressMobile: Story = {
  ...SetupInProgress,
  name: "创建中账本（360px 手机宽度）",
  decorators: [
    (Story) => (
      <Box sx={{ width: 360, maxWidth: "100%" }}>
        <Story />
      </Box>
    ),
  ],
};

export const SwitchSucceeded: Story = {
  name: "切换账本成功",
  args: {
    currentLedgerId: "00000000-0000-4000-8000-000000000002",
    switchResult: "switched",
  },
};

export const SwitchFailed: Story = {
  name: "切换账本失败",
  args: {
    errorKey: "storybook-switch-error",
    errorMessage:
      currentLedgerErrorMessages[currentLedgerErrorCodes.updateFailed],
  },
};

export const SingleLedger: Story = {
  name: "仅一个账本",
  args: {
    ledgers: [ledgers[0]],
  },
};

export const EmptyTemplateOnly: Story = {
  name: "无账本空状态（组件确认用）",
  args: {
    currentLedgerId: "",
    ledgers: [],
  },
};
