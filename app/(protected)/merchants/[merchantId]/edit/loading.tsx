import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

import { merchantPageMessages, merchantText } from "config/merchantText";
import { routePaths } from "config/paths";
import { SectionCard } from "molecules/ui/SectionCard";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";

export default function MerchantEditLoading() {
  return (
    <SettingsPageLayout
      action={<Skeleton aria-hidden height={30} width={88} />}
      back={{
        href: routePaths.merchants,
        label: merchantPageMessages.backToMerchants,
      }}
      subtitle={<Skeleton sx={{ maxWidth: "100%" }} width={200} />}
      title={merchantText.edit}
    >
      <SectionCard role="status" sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Skeleton
              sx={{ height: { xs: 84, sm: 96 }, width: { xs: 84, sm: 96 } }}
              variant="circular"
            />
            <Stack spacing={1} sx={{ flex: 1 }}>
              <Skeleton width="65%" />
              <Skeleton width="90%" />
            </Stack>
          </Stack>
          <Skeleton height={40} variant="rounded" />
          <Skeleton height={40} variant="rounded" />
          <Skeleton height={72} variant="rounded" />
          <Skeleton height={40} variant="rounded" />
        </Stack>
      </SectionCard>
      <SectionCard sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={1}>
          <Skeleton width="30%" />
          <Skeleton width="75%" />
          <Skeleton height={48} variant="rounded" />
          <Skeleton height={48} variant="rounded" />
          <Skeleton height={40} variant="rounded" />
        </Stack>
      </SectionCard>
    </SettingsPageLayout>
  );
}
