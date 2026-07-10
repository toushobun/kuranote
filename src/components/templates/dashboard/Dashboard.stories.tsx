import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CSSProperties } from "react";

import {
  createDashboardViewData,
  createNoLedgerDashboardViewData,
} from "@/test/mocks/dashboard";
import { getUserThemeCssVariables } from "theme/userThemeCssVariables";
import type { UserThemeKey } from "theme/userThemeTokens";
import type { DashboardViewData } from "types/dashboard";

import { DashboardTemplate } from "./Dashboard";

const dashboardData = createDashboardViewData();
const noLedgerDashboardData = createNoLedgerDashboardViewData();

function renderWithTheme(
  themeKey: UserThemeKey,
  data: DashboardViewData = dashboardData,
) {
  return function ThemedDashboardTemplate() {
    return (
      <div
        data-user-theme={themeKey}
        style={getUserThemeCssVariables(themeKey) as CSSProperties}
      >
        <DashboardTemplate data={data} />
      </div>
    );
  };
}

const meta = {
  title: "Templates/Dashboard/DashboardTemplate",
  component: DashboardTemplate,
  args: {
    data: dashboardData,
  },
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
