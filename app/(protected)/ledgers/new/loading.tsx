import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

import { SoftCard } from "atoms/ui/SoftCard";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { PageShell } from "templates/layout/PageShell";

const colorOptionCount = 6;
const automaticItemCount = 4;

export default function LedgerCreateLoadingPage() {
  return (
    <Box aria-busy="true" aria-label="账本创建页面加载中" role="status">
      <Box aria-hidden="true" sx={pageBackgroundSx} />
      <PageShell maxWidth="xs" sx={pageShellSx}>
        <Stack spacing={1.6} sx={formSx}>
          <Stack spacing={1.2} sx={headerSx}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
              <Skeleton height={40} variant="circular" width={40}>
                <ArrowBackRoundedIcon />
              </Skeleton>
              <Skeleton sx={{ fontSize: 30 }} width="52%" />
            </Stack>
            <Skeleton sx={{ fontSize: 16 }} width="88%" />
          </Stack>

          <SoftCard sx={formCardSx}>
            <Stack spacing={2.1}>
              <LoadingField />
              <LoadingField />
              <LoadingField showHelper />
              <Stack spacing={1.1}>
                <Skeleton sx={{ fontSize: 16 }} width="32%" />
                <Stack direction="row" sx={colorPickerSx}>
                  {Array.from({ length: colorOptionCount }, (_, index) => (
                    <Skeleton
                      data-testid="ledger-create-loading-color"
                      height={44}
                      key={index}
                      variant="circular"
                      width={44}
                    />
                  ))}
                </Stack>
                <Skeleton sx={{ fontSize: 14 }} width="60%" />
              </Stack>
            </Stack>
          </SoftCard>

          <SoftCard sx={automaticCardSx}>
            <Stack
              direction="row"
              spacing={1.45}
              sx={{ alignItems: "flex-start" }}
            >
              <Skeleton height={48} variant="circular" width={48}>
                <ChecklistRoundedIcon />
              </Skeleton>
              <Stack spacing={1.15} sx={{ flex: 1, minWidth: 0 }}>
                <Skeleton sx={{ fontSize: 18 }} width="58%" />
                <Stack spacing={0.9}>
                  {Array.from({ length: automaticItemCount }, (_, index) => (
                    <Stack
                      direction="row"
                      key={index}
                      spacing={0.8}
                      sx={{ alignItems: "center" }}
                    >
                      <Skeleton height={20} variant="circular" width={20} />
                      <Skeleton sx={{ flex: 1, fontSize: 14 }} />
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Stack>
          </SoftCard>

          <Stack direction="row" spacing={1.5} sx={actionBarSx}>
            <Skeleton height={48} sx={{ flex: 1 }} variant="rounded" />
            <Skeleton height={48} sx={{ flex: 1 }} variant="rounded" />
          </Stack>
        </Stack>
      </PageShell>
    </Box>
  );
}

function LoadingField({ showHelper = false }: { showHelper?: boolean }) {
  return (
    <Stack data-testid="ledger-create-loading-field" spacing={0.9}>
      <Skeleton sx={{ fontSize: 16 }} width="28%" />
      <Skeleton height={56} variant="rounded" width="100%" />
      {showHelper ? <Skeleton sx={{ fontSize: 14 }} width="68%" /> : null}
    </Stack>
  );
}

const pageBackgroundSx = {
  bgcolor: "background.paper",
  inset: 0,
  position: "fixed",
  zIndex: -1,
};

const pageShellSx = {
  px: { xs: 0.75 },
  py: { xs: 0.75 },
};

const formSx = {
  pb: `calc(${bottomNavigationLayout.shellPaddingBottom} + 8px)`,
};

const headerSx = {
  px: { xs: 0.25, sm: 0.5 },
};

const formCardSx = {
  borderRadius: 2,
  p: { xs: 1.6, sm: 2 },
};

const colorPickerSx = {
  alignItems: "center",
  flexWrap: "wrap",
  gap: { xs: 1.2, sm: 1.45 },
};

const automaticCardSx = {
  borderRadius: 2,
  p: { xs: 1.7, sm: 2 },
};

const actionBarSx = {
  bgcolor: "background.paper",
  bottom: 0,
  borderTop: "1px solid",
  borderColor: "divider",
  mx: { xs: -0.75 },
  px: { xs: 1.5, sm: 2 },
  py: { xs: 1.2, sm: 1.4 },
  position: "sticky",
  zIndex: 1,
};
