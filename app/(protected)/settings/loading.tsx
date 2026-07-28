import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

import { SectionCard } from "molecules/ui/SectionCard";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";
import { userThemeCardBorder } from "theme/userThemeCardSx";

const settingsLoadingGroupSizes = [1, 5, 3, 3] as const;

export default function SettingsLoadingPage() {
  return (
    <Box role="status" aria-label="页面数据加载中" aria-busy="true">
      <PageShell maxWidth="sm">
        <PageHeader title="我的" />

        <Stack spacing={1.25}>
          {settingsLoadingGroupSizes.map((count, groupIndex) => (
            <SectionCard key={groupIndex} sx={settingsLoadingCardSx}>
              {Array.from({ length: count }, (_, index) => (
                <Stack
                  direction="row"
                  key={index}
                  spacing={1.5}
                  sx={settingsLoadingRowSx(index === count - 1)}
                >
                  <Skeleton variant="circular" width={30} height={30} />
                  <Skeleton width="38%" sx={{ fontSize: 16 }} />
                  <Box sx={{ flex: 1 }} />
                  <Skeleton width={20} sx={{ fontSize: 16 }} />
                </Stack>
              ))}
            </SectionCard>
          ))}
        </Stack>
      </PageShell>
    </Box>
  );
}

const settingsLoadingCardSx = {
  overflow: "hidden",
  p: 0,
};

function settingsLoadingRowSx(isLast: boolean) {
  return {
    alignItems: "center",
    borderBottom: isLast ? 0 : userThemeCardBorder,
    minHeight: 52,
    px: 2,
    py: 1.25,
  } as const;
}
