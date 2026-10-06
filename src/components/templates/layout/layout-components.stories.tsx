import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CSSProperties, ReactNode } from "react";

import { CreateButton } from "atoms/ui/CreateButton";
import { DataItemCard } from "atoms/ui/DataItemCard";
import { IconBadge } from "atoms/ui/IconBadge";
import { SectionCard } from "molecules/ui/SectionCard";
import { getUserThemeCssVariables } from "theme/userThemeCssVariables";

import { PageFrame } from "./PageFrame";
import { PageHeader } from "./PageHeader";
import { PageShell } from "./PageShell";
import {
  SettingsPageLayout,
  settingsPageActionButtonSx,
} from "./SettingsPageLayout";

const meta = {
  title: "Templates/Layout/CommonLayout",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function ThemeStory({ children }: { children: ReactNode }) {
  return (
    <div style={getUserThemeCssVariables("amberWarmth") as CSSProperties}>
      {children}
    </div>
  );
}

export const FrameWithHeader: Story = {
  name: "PageFrame + PageHeader",
  render: () => (
    <ThemeStory>
      <PageFrame>
        <PageHeader
          leading={
            <IconBadge label="账户图标">
              <AccountBalanceWalletRoundedIcon fontSize="small" />
            </IconBadge>
          }
          title="账户"
          subtitle="管理现金、银行账户、信用卡、电子钱包等账户。"
          action={<Button variant="contained">新增账户</Button>}
        />
        <SectionCard>页面主要内容区域</SectionCard>
      </PageFrame>
    </ThemeStory>
  ),
};

export const ShellWithHeader: Story = {
  name: "PageShell + PageHeader（既存）",
  render: () => (
    <ThemeStory>
      <PageShell>
        <PageHeader
          title="账户"
          subtitle="管理现金、银行账户、信用卡、电子钱包等账户。"
          action={<Button variant="contained">新增账户</Button>}
        />
        <SectionCard>页面主要内容区域</SectionCard>
      </PageShell>
    </ThemeStory>
  ),
};

export const HeaderOnly: Story = {
  name: "PageHeader",
  render: () => (
    <ThemeStory>
      <PageHeader
        title="商家"
        subtitle="管理常用商家、平台、公司和个人。"
        action={<Button variant="outlined">导入</Button>}
      />
    </ThemeStory>
  ),
};

export const CompactHeader: Story = {
  name: "PageHeader（紧凑）",
  render: () => (
    <ThemeStory>
      <PageShell maxWidth="sm">
        <PageHeader
          action={<Button size="small">新增商家</Button>}
          leading={
            <IconButton aria-label="返回">
              <ArrowBackRoundedIcon />
            </IconButton>
          }
          subtitle="管理常用商家和头像信息"
          title="商家管理"
          variant="compact"
        />
      </PageShell>
    </ThemeStory>
  ),
};

export const HeaderWithRichSubtitle: Story = {
  name: "PageHeader（ReactNode subtitle）",
  render: () => (
    <ThemeStory>
      <PageHeader
        title="统计"
        subtitle={
          <Stack spacing={0.5}>
            <span>当前账本：家庭账本</span>
            <Typography color="text.secondary" variant="body2">
              按月份整理收支、分类和商家，让家庭账本一眼看清。
            </Typography>
          </Stack>
        }
      />
    </ThemeStory>
  ),
};

export const SettingsPageWithBack: Story = {
  name: "SettingsPageLayout（二级页面）",
  render: () => (
    <ThemeStory>
      <SettingsPageLayout
        action={
          <CreateButton size="small" sx={settingsPageActionButtonSx}>
            新增账户
          </CreateButton>
        }
        back={{ href: "/settings", label: "返回设置" }}
        subtitle="整理家里的现金、银行卡、电子钱包和信用卡"
        title="账户管理"
      >
        <Stack spacing={0.9}>
          <DataItemCard>
            <Typography>现金</Typography>
          </DataItemCard>
          <DataItemCard>
            <Typography>银行卡</Typography>
          </DataItemCard>
        </Stack>
      </SettingsPageLayout>
    </ThemeStory>
  ),
};

export const SettingsPageTopLevel: Story = {
  name: "SettingsPageLayout（一级页面，无返回）",
  render: () => (
    <ThemeStory>
      <SettingsPageLayout subtitle="管理个人信息、主题与应用设置" title="我的">
        <SectionCard>菜单分组区域</SectionCard>
      </SettingsPageLayout>
    </ThemeStory>
  ),
};
