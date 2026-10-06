import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { ReactNode } from "react";

import { designTokens } from "theme/theme";

import { PageHeader } from "./PageHeader";
import { PageShell } from "./PageShell";
import { SettingsPageBackButton } from "./SettingsPageBackButton";
import { fullViewportPageBackgroundSx } from "./fullViewportPageBackgroundSx";

type SettingsPageBack = {
  href: string;
  label: string;
};

type SettingsPageLayoutProps = {
  action?: ReactNode;
  back?: SettingsPageBack;
  children: ReactNode;
  subtitle?: ReactNode;
  title: ReactNode;
};

// 「我的」一级页面与各级子页面共用的页面骨架：统一页面背景、内容宽度、头部样式与头部下方间距。
export function SettingsPageLayout({
  action,
  back,
  children,
  subtitle,
  title,
}: SettingsPageLayoutProps) {
  return (
    <>
      <Box
        aria-hidden="true"
        data-testid="settings-page-background"
        sx={fullViewportPageBackgroundSx}
      />
      <PageShell maxWidth="xs" sx={settingsPageShellSx}>
        <Stack spacing={{ xs: 2, sm: 2.5 }}>
          <PageHeader
            action={action}
            leading={
              back ? (
                <SettingsPageBackButton href={back.href} label={back.label} />
              ) : null
            }
            subtitle={subtitle}
            title={title}
            variant="compact"
          />
          {children}
        </Stack>
      </PageShell>
    </>
  );
}

const settingsPageShellSx = {
  pb: { xs: 3, sm: 5 },
  pt: { xs: 2, sm: 4 },
  px: { xs: 0.75 },
};

// 头部右侧「新增」按钮的统一样式，配合 size="small" 使用。
export const settingsPageActionButtonSx = {
  borderRadius: `${designTokens.radius.full}px`,
  px: { xs: 1.5, sm: 2.5 },
  whiteSpace: "nowrap",
} as const;
