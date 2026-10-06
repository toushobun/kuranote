import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { SoftCard } from "atoms/ui/SoftCard";
import { ledgerSettingsPageMessages } from "config/ledgerMessages";
import { routePaths } from "config/paths";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";
import { designTokens } from "theme/theme";
import { typographyStyles } from "theme/typographyTokens";

const memberLoadingRows = 3;

// 与 LedgerSettings 结构一致：基础信息、特殊状态设置、成员、底部操作栏。
export default function LedgerSettingsLoadingPage() {
  return (
    <Box
      aria-busy="true"
      aria-label={ledgerSettingsPageMessages.loading}
      role="status"
    >
      <SettingsPageLayout
        back={{
          href: routePaths.ledgers,
          label: ledgerSettingsPageMessages.backToLedgers,
        }}
        subtitle={ledgerSettingsPageMessages.subtitle}
        title={ledgerSettingsPageMessages.title}
      >
        <Stack spacing={1.45} sx={formSx}>
          <Stack spacing={0.9}>
            <Typography component="h2" sx={sectionTitleSx}>
              基础信息
            </Typography>
            <SoftCard sx={sectionCardSx}>
              <Stack spacing={1.5}>
                <LoadingField />
                <LoadingField />
              </Stack>
            </SoftCard>
          </Stack>

          <Skeleton height={72} sx={roundedSkeletonSx} variant="rounded" />

          <Stack spacing={0.9}>
            <Typography component="h2" sx={sectionTitleSx}>
              成员
            </Typography>
            <SoftCard sx={sectionCardSx}>
              <Stack spacing={1.25}>
                {Array.from({ length: memberLoadingRows }, (_, index) => (
                  <Stack
                    direction="row"
                    key={index}
                    spacing={1.25}
                    sx={{ alignItems: "center" }}
                  >
                    <Skeleton height={40} variant="circular" width={40} />
                    <Stack spacing={0.5} sx={{ flex: 1 }}>
                      <Skeleton sx={{ fontSize: 16 }} width="46%" />
                      <Skeleton sx={{ fontSize: 13 }} width="30%" />
                    </Stack>
                    <Skeleton height={24} variant="rounded" width={52} />
                  </Stack>
                ))}
              </Stack>
            </SoftCard>
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <Skeleton height={44} sx={{ flex: 1 }} variant="rounded" />
            <Skeleton height={44} sx={{ flex: 1 }} variant="rounded" />
          </Stack>
        </Stack>
      </SettingsPageLayout>
    </Box>
  );
}

function LoadingField() {
  return (
    <Stack direction="row" spacing={1.4} sx={{ alignItems: "center" }}>
      <Skeleton height={46} variant="circular" width={46} />
      <Stack spacing={0.65} sx={{ flex: 1 }}>
        <Skeleton sx={{ fontSize: 15 }} width="28%" />
        <Skeleton height={40} sx={roundedSkeletonSx} variant="rounded" />
      </Stack>
    </Stack>
  );
}

const formSx = {
  pb: `calc(${bottomNavigationLayout.shellPaddingBottom} + 24px)`,
};

const sectionTitleSx = {
  ...typographyStyles.cardTitle,
  fontSize: { xs: 18, sm: 19 },
  fontWeight: 900,
  px: 0.35,
};

const sectionCardSx = {
  borderRadius: `${designTokens.radius.lg}px`,
  p: { xs: 1.5, sm: 1.75 },
};

const roundedSkeletonSx = {
  borderRadius: `${designTokens.radius.md}px`,
};
