import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

import { settingsProfilePageMessages as messages } from "config/settingsMessages";
import { SectionCard } from "molecules/ui/SectionCard";
import { SettingsEntryGroupSkeleton } from "organisms/settings/SettingsEntryList/SettingsEntryGroupSkeleton";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";

// 与个人主页结构一致：个人资料 1 行、账号安全 2 行、账号操作 1 行。
const profileLoadingGroupSizes = [1, 2, 1] as const;

export default function SettingsProfileLoading() {
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
        <Stack spacing={1.25}>
          <SectionCard>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Skeleton variant="circular" width={64} height={64} />
              <Stack spacing={0.75} sx={{ flex: 1 }}>
                <Skeleton variant="text" width="40%" height={28} />
                <Skeleton variant="text" width="60%" />
              </Stack>
            </Stack>
          </SectionCard>
          {profileLoadingGroupSizes.map((count, groupIndex) => (
            <SettingsEntryGroupSkeleton count={count} key={groupIndex} />
          ))}
        </Stack>
      </Box>
    </PageShell>
  );
}
