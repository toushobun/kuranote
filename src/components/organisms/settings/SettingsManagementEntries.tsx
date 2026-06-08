import Stack from "@mui/material/Stack";

import { SettingsAccountsEntry } from "molecules/settings/SettingsAccountsEntry";
import { SettingsCategoriesEntry } from "molecules/settings/SettingsCategoriesEntry";

export function SettingsManagementEntries() {
  return (
    <Stack spacing={3}>
      <SettingsAccountsEntry />
      <SettingsCategoriesEntry />
    </Stack>
  );
}
