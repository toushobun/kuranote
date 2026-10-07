import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CSSProperties } from "react";

import {
  createDashboardViewData,
  createNoLedgerDashboardViewData,
} from "@/test/mocks/dashboard";
import {
  createLedgerSetupWizardLauncherStoryActions,
  ledgerSetupWizardStoryDecorators,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStoryUtils";
import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";
import { getUserThemeCssVariables } from "theme/userThemeCssVariables";
import type { UserThemeKey } from "theme/userThemeTokens";
import type { DashboardViewData } from "types/dashboard";
import type { LedgerSetupInProgressSummary } from "types/ledgers";

import { DashboardTemplate } from "./Dashboard";

const dashboardData = createDashboardViewData();
const noLedgerDashboardData = createNoLedgerDashboardViewData();
const setupProgress = createLedgerSetupProgressFixture({
  name: "我们家",
  step: 3,
});
const setupInProgress: LedgerSetupInProgressSummary = {
  name: setupProgress.setup.name,
  step: setupProgress.setup.step,
};
const setupWizardActions = createLedgerSetupWizardLauncherStoryActions();

function renderWithTheme(
  themeKey: UserThemeKey,
  data: DashboardViewData = dashboardData,
  continueSetup: LedgerSetupInProgressSummary | null = null,
) {
  return function ThemedDashboardTemplate() {
    return (
      <div
        data-user-theme={themeKey}
        style={getUserThemeCssVariables(themeKey) as CSSProperties}
      >
        <DashboardTemplate
          data={data}
          setupInProgress={continueSetup}
          setupWizardActions={
            continueSetup
              ? createLedgerSetupWizardLauncherStoryActions(setupProgress)
              : setupWizardActions
          }
        />
      </div>
    );
  };
}

const meta = {
  title: "Templates/Dashboard/DashboardTemplate",
  component: DashboardTemplate,
  args: {
    data: dashboardData,
    setupWizardActions,
  },
  // 无账本时可以打开创建账本向导。
  decorators: ledgerSetupWizardStoryDecorators,
} satisfies Meta<typeof DashboardTemplate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "琥珀暖阳",
  render: renderWithTheme("amberWarmth"),
};

export const LavenderDream: Story = {
  name: "薰衣草梦境",
  render: renderWithTheme("lavenderDream"),
};

export const EmeraldMorning: Story = {
  name: "翡翠晨露",
  render: renderWithTheme("emeraldMorning"),
};

export const SakuraStory: Story = {
  name: "粉樱物语",
  render: renderWithTheme("sakuraStory"),
};

export const DeepSeaStarlight: Story = {
  name: "深海星光",
  render: renderWithTheme("deepSeaStarlight"),
};

export const FlameRed: Story = {
  name: "烈焰赤红",
  render: renderWithTheme("flameRed"),
};

export const NoLedgerDefault: Story = {
  name: "无账本 / 琥珀暖阳",
  render: renderWithTheme("amberWarmth", noLedgerDashboardData),
};

export const NoLedgerLavenderDream: Story = {
  name: "无账本 / 薰衣草梦境",
  render: renderWithTheme("lavenderDream", noLedgerDashboardData),
};

export const NoLedgerEmeraldMorning: Story = {
  name: "无账本 / 翡翠晨露",
  render: renderWithTheme("emeraldMorning", noLedgerDashboardData),
};

export const NoLedgerSakuraStory: Story = {
  name: "无账本 / 粉樱物语",
  render: renderWithTheme("sakuraStory", noLedgerDashboardData),
};

export const NoLedgerDeepSeaStarlight: Story = {
  name: "无账本 / 深海星光",
  render: renderWithTheme("deepSeaStarlight", noLedgerDashboardData),
};

export const NoLedgerFlameRed: Story = {
  name: "无账本 / 烈焰赤红",
  render: renderWithTheme("flameRed", noLedgerDashboardData),
};

export const ContinueSetupDefault: Story = {
  name: "继续创建 / 琥珀暖阳",
  render: renderWithTheme(
    "amberWarmth",
    noLedgerDashboardData,
    setupInProgress,
  ),
};

export const ContinueSetupLavenderDream: Story = {
  name: "继续创建 / 薰衣草梦境",
  render: renderWithTheme(
    "lavenderDream",
    noLedgerDashboardData,
    setupInProgress,
  ),
};
