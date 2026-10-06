import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

import { DataItemCard } from "atoms/ui/DataItemCard";
import { accountPageMessages } from "config/accountMessages";
import { routePaths } from "config/paths";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";
import { designTokens } from "theme/theme";

const accountLoadingRows = 4;

export default function AccountsLoadingPage() {
  return (
    <Box
      aria-busy="true"
      aria-label={accountPageMessages.loading}
      role="status"
    >
      <SettingsPageLayout
        action={
          <Skeleton
            height={30}
            sx={{ borderRadius: `${designTokens.radius.full}px` }}
            variant="rounded"
            width={104}
          />
        }
        back={{
          href: routePaths.settings,
          label: accountPageMessages.backToSettings,
        }}
        subtitle={accountPageMessages.subtitle}
        title={accountPageMessages.title}
      >
        <Stack spacing={1.35}>
          <DataItemCard>
            <Stack spacing={1.5}>
              <Stack spacing={0.5}>
                <Skeleton sx={{ fontSize: 14 }} width="24%" />
                <Skeleton sx={{ fontSize: 30 }} width="58%" />
              </Stack>
              <Skeleton />
              <Stack direction="row" spacing={2}>
                <Skeleton height={38} variant="rounded" width="42%" />
                <Skeleton height={38} variant="rounded" width="42%" />
              </Stack>
            </Stack>
          </DataItemCard>

          <Stack direction="row" spacing={0.7}>
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton height={32} key={index} variant="rounded" width={58} />
            ))}
          </Stack>

          <Stack spacing={0.9}>
            {Array.from({ length: accountLoadingRows }, (_, index) => (
              <DataItemCard key={index}>
                <Stack
                  direction="row"
                  spacing={1.25}
                  sx={{ alignItems: "center" }}
                >
                  <Skeleton height={38} variant="rounded" width={38} />
                  <Stack spacing={0.5} sx={{ flex: 1 }}>
                    <Skeleton sx={{ fontSize: 17 }} width="62%" />
                    <Skeleton sx={{ fontSize: 14 }} width="48%" />
                  </Stack>
                  <Stack spacing={0.5} sx={{ alignItems: "flex-end" }}>
                    <Skeleton sx={{ fontSize: 17 }} width={82} />
                    <Skeleton height={24} variant="rounded" width={54} />
                  </Stack>
                </Stack>
              </DataItemCard>
            ))}
          </Stack>
        </Stack>
      </SettingsPageLayout>
    </Box>
  );
}
