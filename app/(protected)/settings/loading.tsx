import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import { SettingsEntryGroupSkeleton } from "organisms/settings/SettingsEntryList/SettingsEntryGroupSkeleton";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";

const settingsLoadingGroupSizes = [2, 4, 3] as const;

export default function SettingsLoadingPage() {
  return (
    <Box role="status" aria-label="页面数据加载中" aria-busy="true">
      <PageShell maxWidth="sm">
        <PageHeader title="我的" />

        <Stack spacing={1.25}>
          {settingsLoadingGroupSizes.map((count, groupIndex) => (
            <SettingsEntryGroupSkeleton count={count} key={groupIndex} />
          ))}
        </Stack>
      </PageShell>
    </Box>
  );
}
