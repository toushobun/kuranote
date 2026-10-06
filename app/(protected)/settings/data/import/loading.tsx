import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { routePaths } from "config/paths";
import {
  dataTransferBackMessages,
  dataImportPageMessages as messages,
} from "config/dataImportExportMessages";
import { SectionCard } from "molecules/ui/SectionCard";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";

export default function DataImportLoading() {
  return (
    <SettingsPageLayout
      back={{
        href: routePaths.settingsData,
        label: dataTransferBackMessages.backToEntry,
      }}
      subtitle={messages.subtitle}
      title={messages.title}
    >
      <Stack
        role="status"
        aria-label={messages.loading}
        aria-busy="true"
        spacing={2.5}
      >
        <SectionCard>
          <Stack spacing={1.5}>
            <Skeleton width="30%" />
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </Stack>
        </SectionCard>
        <SectionCard>
          <Stack spacing={1.5}>
            <Skeleton width="30%" />
            <Skeleton variant="rounded" height={40} width={120} />
            <Skeleton width="40%" />
            <Skeleton variant="rounded" height={40} />
          </Stack>
        </SectionCard>
      </Stack>
    </SettingsPageLayout>
  );
}
