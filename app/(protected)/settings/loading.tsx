import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import { settingsPageMessages } from "config/settingsMessages";
import { SettingsEntryGroupSkeleton } from "organisms/settings/SettingsEntryList/SettingsEntryGroupSkeleton";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";

const settingsLoadingGroupSizes = [2, 4, 3] as const;

export default function SettingsLoadingPage() {
  return (
    <Box role="status" aria-label="页面数据加载中" aria-busy="true">
      <SettingsPageLayout
        subtitle={settingsPageMessages.subtitle}
        title={settingsPageMessages.title}
      >
        <Stack spacing={1.25}>
          {settingsLoadingGroupSizes.map((count, groupIndex) => (
            <SettingsEntryGroupSkeleton count={count} key={groupIndex} />
          ))}
        </Stack>
      </SettingsPageLayout>
    </Box>
  );
}
