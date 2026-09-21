import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { dataImportPageMessages as messages } from "config/dataImportExportMessages";
import { SectionCard } from "molecules/ui/SectionCard";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";

export default function DataImportLoading() {
  return (
    <PageShell maxWidth="sm">
      <PageHeader
        title={messages.title}
        subtitle={messages.subtitle}
        variant="compact"
        leading={<Skeleton variant="circular" width={40} height={40} />}
      />
      <Stack
        role="status"
        aria-label={messages.loading}
        aria-busy="true"
        spacing={2.5}
        sx={{ mt: 3 }}
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
    </PageShell>
  );
}
