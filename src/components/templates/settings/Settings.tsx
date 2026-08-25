"use client";

import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import ImportExportOutlinedIcon from "@mui/icons-material/ImportExportOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import SwapVertRoundedIcon from "@mui/icons-material/SwapVertRounded";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Collapse from "@mui/material/Collapse";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useMemo, useState, type ElementType } from "react";

import { routePaths, type AppRoutePath } from "config/paths";
import { TransactionColorSchemePicker } from "molecules/theme/TransactionColorSchemePicker/TransactionColorSchemePicker";
import { SectionCard } from "molecules/ui/SectionCard";
import { UserThemePicker } from "molecules/theme/UserThemePicker";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { typographyStyles } from "theme/typographyTokens";
import { userThemeCardBorder } from "theme/userThemeCardSx";
import type { ServerAction } from "types/actions";
import type { TransactionColorSchemeAction } from "types/user";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";

type SettingsEntryBase = {
  icon: ElementType<SvgIconProps>;
  label: string;
  trailing?: string;
};

type SettingsEntry = SettingsEntryBase &
  (
    | { kind: "comingSoon" }
    | { href: AppRoutePath; kind: "link" }
    | { kind: "logout" }
    | { kind: "transactionColors" }
    | { kind: "theme" }
  );

type SettingsEntryGroup = {
  entries: readonly SettingsEntry[];
  label: string;
};

type ExpandableSettingsEntryKind = "theme" | "transactionColors";

function createSettingsEntryGroups(
  currentLedgerName: string,
): readonly SettingsEntryGroup[] {
  return [
    {
      label: "个人",
      entries: [
        {
          icon: PersonOutlineOutlinedIcon,
          kind: "comingSoon",
          label: "个人主页",
        },
      ],
    },
    {
      label: "管理",
      entries: [
        { icon: PaletteOutlinedIcon, kind: "theme", label: "主题换装" },
        {
          icon: SwapVertRoundedIcon,
          kind: "transactionColors",
          label: "收支颜色",
        },
        {
          href: routePaths.ledgers,
          icon: MenuBookOutlinedIcon,
          kind: "link",
          label: "账本管理",
          trailing: currentLedgerName,
        },
        {
          href: routePaths.accounts,
          icon: AccountBalanceWalletOutlinedIcon,
          kind: "link",
          label: "账户管理",
        },
        {
          href: routePaths.categories,
          icon: CategoryOutlinedIcon,
          kind: "link",
          label: "分类管理",
        },
        { icon: StorefrontOutlinedIcon, kind: "comingSoon", label: "商家管理" },
      ],
    },
    {
      label: "系统",
      entries: [
        {
          icon: LanguageOutlinedIcon,
          kind: "comingSoon",
          label: "语言设置",
          trailing: "简体中文",
        },
        {
          icon: ImportExportOutlinedIcon,
          kind: "comingSoon",
          label: "数据导入导出",
        },
        { icon: TuneOutlinedIcon, kind: "comingSoon", label: "App 偏好设置" },
      ],
    },
    {
      label: "支持",
      entries: [
        {
          icon: HelpOutlineOutlinedIcon,
          kind: "comingSoon",
          label: "帮助与反馈",
        },
        { icon: InfoOutlinedIcon, kind: "comingSoon", label: "关于 KuraNote" },
        { icon: LogoutRoundedIcon, kind: "logout", label: "退出登录" },
      ],
    },
  ];
}

const comingSoonMessage = "正在准备中";

type SettingsTemplateProps = {
  currentLedgerName: string;
  logoutAction: ServerAction;
  updateTransactionColorSchemeAction: TransactionColorSchemeAction;
};

export function SettingsTemplate({
  currentLedgerName,
  logoutAction,
  updateTransactionColorSchemeAction,
}: SettingsTemplateProps) {
  const [expandedEntry, setExpandedEntry] =
    useState<ExpandableSettingsEntryKind | null>(null);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const settingsEntryGroups = useMemo(
    () => createSettingsEntryGroups(currentLedgerName),
    [currentLedgerName],
  );

  const showComingSoonToast = () => {
    setIsToastOpen(true);
  };

  const closeComingSoonToast = () => {
    setIsToastOpen(false);
  };

  const toggleExpandedEntry = (entry: ExpandableSettingsEntryKind) => {
    setExpandedEntry((current) => (current === entry ? null : entry));
  };

  return (
    <PageShell maxWidth="sm">
      <PageHeader subtitle="管理个人信息、主题与应用设置" title="我的" />

      <Stack spacing={1.25}>
        {settingsEntryGroups.map((group) => (
          <SettingsEntryGroupCard
            expandedEntry={expandedEntry}
            group={group}
            key={group.label}
            logoutAction={logoutAction}
            onComingSoonClick={showComingSoonToast}
            onExpandableEntryClick={toggleExpandedEntry}
            updateTransactionColorSchemeAction={
              updateTransactionColorSchemeAction
            }
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
  expandedEntry: ExpandableSettingsEntryKind | null;
  group: SettingsEntryGroup;
  logoutAction: ServerAction;
  onComingSoonClick: () => void;
  onExpandableEntryClick: (entry: ExpandableSettingsEntryKind) => void;
  updateTransactionColorSchemeAction: TransactionColorSchemeAction;
};

function SettingsEntryGroupCard({
  expandedEntry,
  group,
  logoutAction,
  onComingSoonClick,
  onExpandableEntryClick,
  updateTransactionColorSchemeAction,
}: SettingsEntryGroupCardProps) {
  return (
    <SectionCard
      component="section"
      aria-label={group.label}
      sx={settingsCardSx}
    >
      {group.entries.map((entry, index) => (
        <SettingsEntryItem
          entry={entry}
          expandedEntry={expandedEntry}
          isLast={index === group.entries.length - 1}
          key={entry.label}
          logoutAction={logoutAction}
          onComingSoonClick={onComingSoonClick}
          onExpandableEntryClick={onExpandableEntryClick}
          updateTransactionColorSchemeAction={
            updateTransactionColorSchemeAction
          }
        />
      ))}
    </SectionCard>
  );
}

type SettingsEntryItemProps = {
  entry: SettingsEntry;
  expandedEntry: ExpandableSettingsEntryKind | null;
  isLast: boolean;
  logoutAction: ServerAction;
  onComingSoonClick: () => void;
  onExpandableEntryClick: (entry: ExpandableSettingsEntryKind) => void;
  updateTransactionColorSchemeAction: TransactionColorSchemeAction;
};

function SettingsEntryItem({
  entry,
  expandedEntry,
  isLast,
  logoutAction,
  onComingSoonClick,
  onExpandableEntryClick,
  updateTransactionColorSchemeAction,
}: SettingsEntryItemProps) {
  if (entry.kind === "link") {
    return (
      <SettingsEntryButton entry={entry} href={entry.href} isLast={isLast} />
    );
  }

  if (entry.kind === "theme") {
    const isExpanded = expandedEntry === entry.kind;

    return (
      <Box>
        <SettingsEntryButton
          entry={entry}
          isExpanded={isExpanded}
          isLast={isLast && !isExpanded}
          onClick={() => onExpandableEntryClick(entry.kind)}
        />
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box sx={themePickerPanelSx}>
            <UserThemePicker />
          </Box>
        </Collapse>
      </Box>
    );
  }

  if (entry.kind === "transactionColors") {
    const isExpanded = expandedEntry === entry.kind;

    return (
      <Box>
        <SettingsEntryButton
          entry={entry}
          isExpanded={isExpanded}
          isLast={isLast && !isExpanded}
          onClick={() => onExpandableEntryClick(entry.kind)}
        />
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box sx={themePickerPanelSx}>
            <TransactionColorSchemePicker
              action={updateTransactionColorSchemeAction}
            />
          </Box>
        </Collapse>
      </Box>
    );
  }

  if (entry.kind === "logout") {
    return (
      <Box component="form" action={logoutAction} sx={{ m: 0 }}>
        <SettingsEntryButton entry={entry} isLast={isLast} type="submit" />
      </Box>
    );
  }

  return (
    <SettingsEntryButton
      entry={entry}
      isLast={isLast}
      onClick={onComingSoonClick}
    />
  );
}

type SettingsEntryButtonProps = {
  entry: SettingsEntry;
  href?: AppRoutePath;
  isExpanded?: boolean;
  isLast: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
};

function SettingsEntryButton({
  entry,
  href,
  isExpanded = false,
  isLast,
  onClick,
  type = "button",
}: SettingsEntryButtonProps) {
  const Icon = entry.icon;
  const isExpandable =
    entry.kind === "theme" || entry.kind === "transactionColors";
  const ChevronIcon = isExpandable
    ? isExpanded
      ? ExpandLessRoundedIcon
      : ExpandMoreRoundedIcon
    : ChevronRightRoundedIcon;
  const buttonContent = (
    <>
      <Box sx={settingsIconBoxSx(entry.kind === "logout")}>
        <Icon fontSize="small" />
      </Box>

      <Typography
        component="span"
        variant="body2"
        sx={settingsEntryLabelSx(entry.kind === "logout")}
      >
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

      {entry.kind === "logout" ? null : <ChevronIcon sx={settingsChevronSx} />}
    </>
  );

  if (href) {
    return (
      <ButtonBase
        component={Link}
        href={href}
        sx={settingsEntryButtonSx(isLast)}
      >
        {buttonContent}
      </ButtonBase>
    );
  }

  return (
    <ButtonBase
      aria-expanded={isExpandable ? isExpanded : undefined}
      component="button"
      type={type}
      onClick={onClick}
      sx={settingsEntryButtonSx(isLast)}
    >
      {buttonContent}
    </ButtonBase>
  );
}

const settingsCardSx = {
  overflow: "hidden",
  p: 0,
};

const themePickerPanelSx = {
  borderBottom: userThemeCardBorder,
  px: 2,
  py: 1.25,
};

function settingsEntryButtonSx(isLast: boolean) {
  return {
    alignItems: "center",
    backgroundColor: "transparent",
    border: 0,
    borderBottom: isLast ? 0 : userThemeCardBorder,
    color: "text.primary",
    display: "flex",
    minHeight: 52,
    px: 2,
    py: 1.25,
    textAlign: "left",
    textDecoration: "none",
    width: "100%",
    "&:focus-visible, &:hover": {
      backgroundColor: "action.hover",
    },
  } as const;
}

function settingsIconBoxSx(isDanger = false) {
  return {
    alignItems: "center",
    bgcolor: isDanger
      ? "rgba(211, 47, 47, 0.1)"
      : "var(--user-theme-icon-badge-bg)",
    borderRadius: "50%",
    color: isDanger ? "error.main" : "var(--user-theme-icon-badge-color)",
    display: "inline-flex",
    flexShrink: 0,
    height: 30,
    justifyContent: "center",
    mr: 1.4,
    width: 30,
  } as const;
}

function settingsEntryLabelSx(isDanger = false) {
  return {
    ...typographyStyles.listText,
    color: isDanger ? "error.main" : "text.primary",
    flex: 1,
    minWidth: 0,
  } as const;
}

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
