import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { merchantPageMessages, merchantText } from "config/merchantText";
import { routePaths } from "config/paths";
import { LoadingState } from "molecules/ui/LoadingState";
import { SectionCard } from "molecules/ui/SectionCard";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";
import { designTokens } from "theme/theme";

export default function MerchantsLoading() {
  return (
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
        label: merchantPageMessages.backToSettings,
      }}
      subtitle={merchantPageMessages.subtitle}
      title={merchantPageMessages.title}
    >
      <SectionCard
        sx={{ borderRadius: `${designTokens.radius.full}px`, p: 0.75 }}
      >
        <Skeleton
          height={32}
          sx={{ borderRadius: `${designTokens.radius.full}px` }}
          variant="rounded"
        />
      </SectionCard>

      <SectionCard sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Typography component="h2" sx={{ fontWeight: 800 }} variant="h6">
              {merchantText.categoryManagement}
            </Typography>
            <Skeleton width={72} />
          </Stack>
          <Stack direction="row" spacing={1}>
            <Skeleton
              height={56}
              sx={{ borderRadius: `${designTokens.radius.item}px` }}
              variant="rounded"
              width={112}
            />
            <Skeleton
              height={56}
              sx={{ borderRadius: `${designTokens.radius.item}px` }}
              variant="rounded"
              width={112}
            />
            <Skeleton
              height={56}
              sx={{ borderRadius: `${designTokens.radius.item}px` }}
              variant="rounded"
              width={112}
            />
          </Stack>
        </Stack>
      </SectionCard>

      <LoadingState description="商家列表读取中，请稍等。" />
    </SettingsPageLayout>
  );
}
