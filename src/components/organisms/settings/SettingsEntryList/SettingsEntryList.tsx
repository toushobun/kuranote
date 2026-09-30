"use client";

import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Collapse from "@mui/material/Collapse";
import Snackbar from "@mui/material/Snackbar";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import type { ElementType, ReactNode } from "react";

import type { AppRoutePath } from "config/paths";
import { settingsComingSoonMessage } from "config/settingsMessages";
import { SectionCard } from "molecules/ui/SectionCard";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { actionHoverInteractionSx } from "theme/actionHoverSx";
import { typographyStyles } from "theme/typographyTokens";
import { userThemeCardBorder } from "theme/userThemeCardSx";

type SettingsEntryGroupCardProps = {
  children: ReactNode;
  label: string;
};

export function SettingsEntryGroupCard({
  children,
  label,
}: SettingsEntryGroupCardProps) {
  return (
    <SectionCard component="section" aria-label={label} sx={settingsCardSx}>
      {children}
    </SectionCard>
  );
}

type SettingsEntryButtonProps = {
  icon: ElementType<SvgIconProps>;
  isLast: boolean;
  label: string;
  // danger 用于退出登录等操作，不显示右侧箭头
  tone?: "default" | "danger";
  trailing?: string;
} & (
  | { href: AppRoutePath }
  | {
      // 传入时表示展开式条目，右侧显示展开 / 收起箭头
      expanded?: boolean;
      href?: never;
      onClick?: () => void;
      type?: "button" | "submit";
    }
);

export function SettingsEntryButton(props: SettingsEntryButtonProps) {
  const { icon: Icon, isLast, label, tone = "default", trailing } = props;
  const isDanger = tone === "danger";
  const expanded = "expanded" in props ? props.expanded : undefined;
  const ChevronIcon =
    expanded === undefined
      ? ChevronRightRoundedIcon
      : expanded
        ? ExpandLessRoundedIcon
        : ExpandMoreRoundedIcon;
  const buttonContent = (
    <>
      <Box sx={settingsIconBoxSx(isDanger)}>
        <Icon fontSize="small" />
      </Box>

      <Typography
        component="span"
        variant="body2"
        sx={settingsEntryLabelSx(isDanger)}
      >
        {label}
      </Typography>

      {trailing ? (
        <Typography
          component="span"
          variant="body2"
          sx={settingsEntryTrailingSx}
        >
          {trailing}
        </Typography>
      ) : null}

      {isDanger ? null : <ChevronIcon sx={settingsChevronSx} />}
    </>
  );

  if (props.href) {
    return (
      <ButtonBase
        component={Link}
        href={props.href}
        sx={settingsEntryButtonSx(isLast)}
      >
        {buttonContent}
      </ButtonBase>
    );
  }

  return (
    <ButtonBase
      aria-expanded={expanded}
      component="button"
      type={"type" in props ? props.type : "button"}
      onClick={"onClick" in props ? props.onClick : undefined}
      sx={settingsEntryButtonSx(isLast)}
    >
      {buttonContent}
    </ButtonBase>
  );
}

type SettingsExpandableEntryProps = {
  children: ReactNode;
  expanded: boolean;
  icon: ElementType<SvgIconProps>;
  isLast: boolean;
  label: string;
  onToggle: () => void;
};

export function SettingsExpandableEntry({
  children,
  expanded,
  icon,
  isLast,
  label,
  onToggle,
}: SettingsExpandableEntryProps) {
  return (
    <Box>
      <SettingsEntryButton
        expanded={expanded}
        icon={icon}
        isLast={isLast && !expanded}
        label={label}
        onClick={onToggle}
      />
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={expandablePanelSx(isLast)}>{children}</Box>
      </Collapse>
    </Box>
  );
}

type SettingsComingSoonToastProps = {
  onClose: () => void;
  open: boolean;
};

export function SettingsComingSoonToast({
  onClose,
  open,
}: SettingsComingSoonToastProps) {
  return (
    <Snackbar
      anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
      autoHideDuration={2400}
      message={settingsComingSoonMessage}
      onClose={onClose}
      open={open}
      sx={settingsToastSx}
    />
  );
}

const settingsCardSx = {
  overflow: "hidden",
  p: 0,
};

function expandablePanelSx(isLast: boolean) {
  return {
    borderBottom: isLast ? 0 : userThemeCardBorder,
    px: 2,
    py: 1.25,
  } as const;
}

function settingsEntryButtonSx(isLast: boolean) {
  return [
    {
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
    },
    actionHoverInteractionSx,
  ] as const;
}

function settingsIconBoxSx(isDanger: boolean) {
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

function settingsEntryLabelSx(isDanger: boolean) {
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
  // MUI Snackbar 在 sm 以上自带 bottom: 24px 的媒体查询，需同样用断点值覆盖。
  bottom: {
    xs: bottomNavigationLayout.feedbackBottomOffset,
    sm: bottomNavigationLayout.feedbackBottomOffset,
  },
};
