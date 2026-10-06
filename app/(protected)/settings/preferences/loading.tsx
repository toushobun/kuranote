import Box from "@mui/material/Box";

import { routePaths } from "config/paths";
import { settingsPreferencesPageMessages as messages } from "config/settingsMessages";
import { SettingsEntryGroupSkeleton } from "organisms/settings/SettingsEntryList/SettingsEntryGroupSkeleton";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";

export default function SettingsPreferencesLoading() {
  return (
    <SettingsPageLayout
      back={{ href: routePaths.settings, label: messages.backToSettings }}
      subtitle={messages.subtitle}
      title={messages.title}
    >
      <Box role="status" aria-label={messages.loading} aria-busy="true">
        <SettingsEntryGroupSkeleton count={3} />
      </Box>
    </SettingsPageLayout>
  );
}
