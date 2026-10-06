import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { routePaths } from "config/paths";
import {
  dataTransferBackMessages,
  dataExportPageMessages as messages,
} from "config/dataImportExportMessages";
import { SectionCard } from "molecules/ui/SectionCard";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";

export default function DataExportLoading() {
  return (
    <SettingsPageLayout
      back={{
        href: routePaths.settingsData,
        label: dataTransferBackMessages.backToEntry,
      }}
      subtitle={messages.subtitle}
      title={messages.title}
    >
      <Stack role="status" aria-label={messages.loading} aria-busy="true">
        <SectionCard>
          <Stack spacing={1.5}>
            <Skeleton width="30%" />
            <Skeleton />
            <Skeleton />
            <Skeleton />
            <Skeleton variant="rounded" height={40} />
          </Stack>
        </SectionCard>
      </Stack>
    </SettingsPageLayout>
  );
}
