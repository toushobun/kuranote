import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

import { settingsPreferencesPageMessages as messages } from "config/settingsMessages";
import { SettingsEntryGroupSkeleton } from "organisms/settings/SettingsEntryList/SettingsEntryGroupSkeleton";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";

export default function SettingsPreferencesLoading() {
  return (
    <PageShell maxWidth="sm">
      <PageHeader
        title={messages.title}
        subtitle={messages.subtitle}
        variant="compact"
        leading={<Skeleton variant="circular" width={40} height={40} />}
      />
      <Box
        role="status"
        aria-label={messages.loading}
        aria-busy="true"
        sx={{ mt: 3 }}
      >
        <SettingsEntryGroupSkeleton count={3} />
      </Box>
    </PageShell>
  );
}
