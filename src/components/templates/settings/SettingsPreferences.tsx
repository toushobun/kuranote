"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import SwapVertRoundedIcon from "@mui/icons-material/SwapVertRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link from "next/link";
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
import type { TransactionColorSchemeAction } from "types/user";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";

type ExpandablePreferenceEntry = "theme" | "transactionColors";

type SettingsPreferencesTemplateProps = {
  updateTransactionColorSchemeAction: TransactionColorSchemeAction;
};

export function SettingsPreferencesTemplate({
  updateTransactionColorSchemeAction,
}: SettingsPreferencesTemplateProps) {
  const [expandedEntry, setExpandedEntry] =
    useState<ExpandablePreferenceEntry | null>(null);
  const [isToastOpen, setIsToastOpen] = useState(false);

  const toggleExpandedEntry = (entry: ExpandablePreferenceEntry) => {
    setExpandedEntry((current) => (current === entry ? null : entry));
  };

  return (
    <PageShell maxWidth="sm">
      <PageHeader
        leading={
          <IconButton
            aria-label={settingsPreferencesPageMessages.backToSettings}
            component={Link}
            href={routePaths.settings}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
        }
        title={settingsPreferencesPageMessages.title}
        subtitle={settingsPreferencesPageMessages.subtitle}
        variant="compact"
      />

      <Box sx={{ mt: 3 }}>
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
            <UserThemePicker />
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
      </Box>

      <SettingsComingSoonToast
        onClose={() => setIsToastOpen(false)}
        open={isToastOpen}
      />
    </PageShell>
  );
}
