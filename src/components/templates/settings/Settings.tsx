"use client";

import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import ImportExportOutlinedIcon from "@mui/icons-material/ImportExportOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import { useMemo, useState, type ElementType } from "react";

import { routePaths, type AppRoutePath } from "config/paths";
import { settingsPreferencesPageMessages } from "config/settingsMessages";
import {
  SettingsComingSoonToast,
  SettingsEntryButton,
  SettingsEntryGroupCard,
} from "organisms/settings/SettingsEntryList/SettingsEntryList";
import type { ServerAction } from "types/actions";
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
  );

type SettingsEntryGroup = {
  entries: readonly SettingsEntry[];
  label: string;
};

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
        {
          href: routePaths.ledgers,
          icon: MenuBookOutlinedIcon,
          kind: "link",
          label: "账本管理",
          trailing: currentLedgerName,
        },
      ],
    },
    {
      label: "管理",
      entries: [
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
        {
          href: routePaths.merchants,
          icon: StorefrontOutlinedIcon,
          kind: "link",
          label: "商家管理",
        },
        {
          href: routePaths.settingsData,
          icon: ImportExportOutlinedIcon,
          kind: "link",
          label: "数据导入导出",
        },
      ],
    },
    {
      label: "应用 / 支持",
      entries: [
        {
          href: routePaths.settingsPreferences,
          icon: TuneOutlinedIcon,
          kind: "link",
          label: settingsPreferencesPageMessages.title,
        },
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

type SettingsTemplateProps = {
  currentLedgerName: string;
  logoutAction: ServerAction;
};

export function SettingsTemplate({
  currentLedgerName,
  logoutAction,
}: SettingsTemplateProps) {
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

  return (
    <PageShell maxWidth="sm">
      <PageHeader subtitle="管理个人信息、主题与应用设置" title="我的" />

      <Stack spacing={1.25}>
        {settingsEntryGroups.map((group) => (
          <SettingsEntryGroupCard key={group.label} label={group.label}>
            {group.entries.map((entry, index) => (
              <SettingsEntryItem
                entry={entry}
                isLast={index === group.entries.length - 1}
                key={entry.label}
                logoutAction={logoutAction}
                onComingSoonClick={showComingSoonToast}
              />
            ))}
          </SettingsEntryGroupCard>
        ))}
      </Stack>

      <SettingsComingSoonToast
        onClose={closeComingSoonToast}
        open={isToastOpen}
      />
    </PageShell>
  );
}

type SettingsEntryItemProps = {
  entry: SettingsEntry;
  isLast: boolean;
  logoutAction: ServerAction;
  onComingSoonClick: () => void;
};

function SettingsEntryItem({
  entry,
  isLast,
  logoutAction,
  onComingSoonClick,
}: SettingsEntryItemProps) {
  const { icon, label, trailing } = entry;

  if (entry.kind === "link") {
    return (
      <SettingsEntryButton
        href={entry.href}
        icon={icon}
        isLast={isLast}
        label={label}
        trailing={trailing}
      />
    );
  }

  if (entry.kind === "logout") {
    return (
      <Box component="form" action={logoutAction} sx={{ m: 0 }}>
        <SettingsEntryButton
          icon={icon}
          isLast={isLast}
          label={label}
          tone="danger"
          type="submit"
        />
      </Box>
    );
  }

  return (
    <SettingsEntryButton
      icon={icon}
      isLast={isLast}
      label={label}
      onClick={onComingSoonClick}
      trailing={trailing}
    />
  );
}
