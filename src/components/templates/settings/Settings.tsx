"use client";

import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import ImportExportOutlinedIcon from "@mui/icons-material/ImportExportOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";
import { useState, type ComponentType } from "react";

import { SectionCard } from "molecules/ui/SectionCard";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { typographyStyles } from "theme/typographyTokens";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";

type SettingsEntry = {
  icon: ComponentType<SvgIconProps>;
  label: string;
  trailing?: string;
};

type SettingsEntryGroup = {
  entries: readonly SettingsEntry[];
  label: string;
};

const settingsEntryGroups = [
  {
    label: "个人",
    entries: [{ icon: PersonOutlineOutlinedIcon, label: "个人主页" }],
  },
  {
    label: "管理",
    entries: [
      { icon: PaletteOutlinedIcon, label: "主题换装" },
      { icon: AccountBalanceWalletOutlinedIcon, label: "账户管理" },
      { icon: CategoryOutlinedIcon, label: "分类管理" },
      { icon: LocalOfferOutlinedIcon, label: "标签管理" },
      { icon: StorefrontOutlinedIcon, label: "商家管理" },
    ],
  },
  {
    label: "系统",
    entries: [
      { icon: LanguageOutlinedIcon, label: "语言设置", trailing: "简体中文" },
      { icon: ImportExportOutlinedIcon, label: "数据导入导出" },
      { icon: TuneOutlinedIcon, label: "App 偏好设置" },
    ],
  },
  {
    label: "支持",
    entries: [
      { icon: HelpOutlineOutlinedIcon, label: "帮助与反馈" },
      { icon: InfoOutlinedIcon, label: "关于 KuraNote" },
    ],
  },
] as const satisfies readonly SettingsEntryGroup[];

const comingSoonMessage = "正在准备中";

export function SettingsTemplate() {
  const [isToastOpen, setIsToastOpen] = useState(false);

  const showComingSoonToast = () => {
    setIsToastOpen(true);
  };

  const closeComingSoonToast = () => {
    setIsToastOpen(false);
  };

  return (
    <PageShell maxWidth="sm">
      <PageHeader title="我的" />

      <Stack spacing={1.25}>
        {settingsEntryGroups.map((group) => (
          <SettingsEntryGroupCard
            group={group}
            key={group.label}
            onEntryClick={showComingSoonToast}
          />
        ))}
      </Stack>

      <Snackbar
        anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
        autoHideDuration={2400}
        message={comingSoonMessage}
        onClose={closeComingSoonToast}
        open={isToastOpen}
        sx={settingsToastSx}
      />
    </PageShell>
  );
}

type SettingsEntryGroupCardProps = {
  group: SettingsEntryGroup;
  onEntryClick: () => void;
};

function SettingsEntryGroupCard({
  group,
  onEntryClick,
}: SettingsEntryGroupCardProps) {
  return (
    <SectionCard component="section" aria-label={group.label} sx={settingsCardSx}>
      {group.entries.map((entry, index) => (
        <SettingsEntryButton
          entry={entry}
          isLast={index === group.entries.length - 1}
          key={entry.label}
          onClick={onEntryClick}
        />
      ))}
    </SectionCard>
  );
}

type SettingsEntryButtonProps = {
  entry: SettingsEntry;
  isLast: boolean;
  onClick: () => void;
};

function SettingsEntryButton({
  entry,
  isLast,
  onClick,
}: SettingsEntryButtonProps) {
  const Icon = entry.icon;

  return (
    <ButtonBase
      component="button"
      type="button"
      onClick={onClick}
      sx={settingsEntryButtonSx(isLast)}
    >
      <Box sx={settingsIconBoxSx}>
        <Icon fontSize="small" />
      </Box>

      <Typography component="span" variant="body2" sx={settingsEntryLabelSx}>
        {entry.label}
      </Typography>

      {entry.trailing ? (
        <Typography
          component="span"
          variant="body2"
          sx={settingsEntryTrailingSx}
        >
          {entry.trailing}
        </Typography>
      ) : null}

      <ChevronRightRoundedIcon sx={settingsChevronSx} />
    </ButtonBase>
  );
}

const settingsCardSx = {
  overflow: "hidden",
  p: 0,
};

function settingsEntryButtonSx(isLast: boolean) {
  return {
    alignItems: "center",
    backgroundColor: "transparent",
    border: 0,
    borderBottom: isLast ? 0 : "1px solid var(--user-theme-card-border)",
    color: "text.primary",
    display: "flex",
    minHeight: 52,
    px: 2,
    py: 1.25,
    textAlign: "left",
    width: "100%",
    "&:focus-visible, &:hover": {
      backgroundColor: "action.hover",
    },
  } as const;
}

const settingsIconBoxSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-icon-badge-bg)",
  borderRadius: "50%",
  color: "var(--user-theme-icon-badge-color)",
  display: "inline-flex",
  flexShrink: 0,
  height: 30,
  justifyContent: "center",
  mr: 1.5,
  width: 30,
};

const settingsEntryLabelSx = {
  ...typographyStyles.listText,
  flex: 1,
  minWidth: 0,
};

const settingsEntryTrailingSx = {
  ...typographyStyles.listText,
  color: "var(--user-theme-action-text)",
  flexShrink: 0,
  ml: 1,
};

const settingsChevronSx = {
  color: "text.secondary",
  flexShrink: 0,
  fontSize: 22,
  ml: 0.75,
};

const settingsToastSx = {
  bottom: {
    xs: `calc(${bottomNavigationLayout.shellPaddingBottom} + 8px)`,
    sm: `calc(${bottomNavigationLayout.shellPaddingBottom} + 8px)`,
  },
};
