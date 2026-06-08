import Stack from "@mui/material/Stack";

import { SettingsManagementEntries } from "organisms/settings/SettingsManagementEntries";
import { SettingsOverviewCard } from "organisms/settings/SettingsOverviewCard";
import { SettingsThemeSection } from "organisms/settings/SettingsThemeSection";

type SettingsTemplateProps = {
  currentLedgerName: string;
  email: string;
  logoutAction: (formData: FormData) => void | Promise<void>;
};

export function SettingsTemplate({
  currentLedgerName,
  email,
  logoutAction,
}: SettingsTemplateProps) {
  return (
    <Stack spacing={3}>
      <SettingsOverviewCard
        currentLedgerName={currentLedgerName}
        email={email}
        logoutAction={logoutAction}
      />
      <SettingsManagementEntries />
      <SettingsThemeSection />
    </Stack>
  );
}
