"use client";

import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import ImportExportOutlinedIcon from "@mui/icons-material/ImportExportOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import Stack from "@mui/material/Stack";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import { useMemo, useState, type ElementType } from "react";

import { accountPageMessages } from "config/accountMessages";
import { categoryPageMessages } from "config/categoryMessages";
import { dataImportExportPageMessages } from "config/dataImportExportMessages";
import { ledgerPageMessages } from "config/ledgerMessages";
import { merchantPageMessages } from "config/merchantText";
import { routePaths, type AppRoutePath } from "config/paths";
import {
  settingsPageMessages,
  settingsPreferencesPageMessages,
  settingsProfilePageMessages,
} from "config/settingsMessages";
import {
  SettingsComingSoonToast,
  SettingsEntryButton,
  SettingsEntryGroupCard,
} from "organisms/settings/SettingsEntryList/SettingsEntryList";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";

type SettingsEntryBase = {
  icon: ElementType<SvgIconProps>;
  label: string;
  trailing?: string;
};

type SettingsEntry = SettingsEntryBase &
  ({ kind: "comingSoon" } | { href: AppRoutePath; kind: "link" });

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
          href: routePaths.settingsProfile,
          icon: PersonOutlineOutlinedIcon,
          kind: "link",
          label: settingsProfilePageMessages.title,
        },
        {
          href: routePaths.ledgers,
          icon: MenuBookOutlinedIcon,
          kind: "link",
          label: ledgerPageMessages.title,
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
          label: accountPageMessages.title,
        },
        {
          href: routePaths.categories,
          icon: CategoryOutlinedIcon,
          kind: "link",
          label: categoryPageMessages.title,
        },
        {
          href: routePaths.merchants,
          icon: StorefrontOutlinedIcon,
          kind: "link",
          label: merchantPageMessages.title,
        },
        {
          href: routePaths.settingsData,
          icon: ImportExportOutlinedIcon,
          kind: "link",
          label: dataImportExportPageMessages.title,
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
      ],
    },
  ];
}

type SettingsTemplateProps = {
  currentLedgerName: string;
};

export function SettingsTemplate({ currentLedgerName }: SettingsTemplateProps) {
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
    <SettingsPageLayout
      subtitle={settingsPageMessages.subtitle}
      title={settingsPageMessages.title}
    >
      <Stack spacing={1.25}>
        {settingsEntryGroups.map((group) => (
          <SettingsEntryGroupCard key={group.label} label={group.label}>
            {group.entries.map((entry, index) => (
              <SettingsEntryItem
                entry={entry}
                isLast={index === group.entries.length - 1}
                key={entry.label}
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
    </SettingsPageLayout>
  );
}

type SettingsEntryItemProps = {
  entry: SettingsEntry;
  isLast: boolean;
  onComingSoonClick: () => void;
};

function SettingsEntryItem({
  entry,
  isLast,
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
