"use client";

import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import SwapVertRoundedIcon from "@mui/icons-material/SwapVertRounded";
import { useState } from "react";

import { routePaths } from "config/paths";
import {
  settingsPreferencesEntryMessages,
  settingsPreferencesPageMessages,
} from "config/settingsMessages";
import { TransactionColorSchemePicker } from "molecules/theme/TransactionColorSchemePicker/TransactionColorSchemePicker";
import { UserThemePicker } from "molecules/theme/UserThemePicker";
import {
  SettingsComingSoonToast,
  SettingsEntryButton,
  SettingsEntryGroupCard,
  SettingsExpandableEntry,
} from "organisms/settings/SettingsEntryList/SettingsEntryList";
import type { ThemeKeyAction, TransactionColorSchemeAction } from "types/user";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";

type ExpandablePreferenceEntry = "theme" | "transactionColors";

type SettingsPreferencesTemplateProps = {
  updateThemeKeyAction: ThemeKeyAction;
  updateTransactionColorSchemeAction: TransactionColorSchemeAction;
};

export function SettingsPreferencesTemplate({
  updateThemeKeyAction,
  updateTransactionColorSchemeAction,
}: SettingsPreferencesTemplateProps) {
  const [expandedEntry, setExpandedEntry] =
    useState<ExpandablePreferenceEntry | null>(null);
  const [isToastOpen, setIsToastOpen] = useState(false);

  const toggleExpandedEntry = (entry: ExpandablePreferenceEntry) => {
    setExpandedEntry((current) => (current === entry ? null : entry));
  };

  return (
    <SettingsPageLayout
      back={{
        href: routePaths.settings,
        label: settingsPreferencesPageMessages.backToSettings,
      }}
      title={settingsPreferencesPageMessages.title}
      subtitle={settingsPreferencesPageMessages.subtitle}
    >
      <SettingsEntryGroupCard
        label={settingsPreferencesPageMessages.entriesLabel}
      >
        <SettingsExpandableEntry
          expanded={expandedEntry === "theme"}
          icon={PaletteOutlinedIcon}
          isLast={false}
          label={settingsPreferencesEntryMessages.theme}
          onToggle={() => toggleExpandedEntry("theme")}
        >
          <UserThemePicker action={updateThemeKeyAction} />
        </SettingsExpandableEntry>
        <SettingsExpandableEntry
          expanded={expandedEntry === "transactionColors"}
          icon={SwapVertRoundedIcon}
          isLast={false}
          label={settingsPreferencesEntryMessages.transactionColors}
          onToggle={() => toggleExpandedEntry("transactionColors")}
        >
          <TransactionColorSchemePicker
            action={updateTransactionColorSchemeAction}
          />
        </SettingsExpandableEntry>
        <SettingsEntryButton
          icon={LanguageOutlinedIcon}
          isLast
          label={settingsPreferencesEntryMessages.language}
          onClick={() => setIsToastOpen(true)}
          trailing={settingsPreferencesEntryMessages.currentLanguage}
        />
      </SettingsEntryGroupCard>

      <SettingsComingSoonToast
        onClose={() => setIsToastOpen(false)}
        open={isToastOpen}
      />
    </SettingsPageLayout>
  );
}
