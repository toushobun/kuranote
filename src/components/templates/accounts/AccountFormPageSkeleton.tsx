import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import type { ReactNode } from "react";

import { accountFormMessages } from "config/accountMessages";
import { routePaths } from "config/paths";
import { SectionCard } from "molecules/ui/SectionCard";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";
import { designTokens } from "theme/theme";

const accountTypeCount = 5;
const holderAvatarCount = 3;

type AccountFormPageSkeletonProps = {
  /** 页面右上角操作（编辑页的删除）的占位。 */
  action?: ReactNode;
  loadingLabel: string;
  title: string;
};

/** 新增 / 编辑账户页面的加载骨架，与页面同结构：基本信息 → 金额 → 持有人 → 底部按钮。 */
export function AccountFormPageSkeleton({
  action,
  loadingLabel,
  title,
}: AccountFormPageSkeletonProps) {
  return (
    <Box aria-busy="true" aria-label={loadingLabel} role="status">
      <SettingsPageLayout
        action={action}
        back={{
          href: routePaths.accounts,
          label: accountFormMessages.backToAccounts,
        }}
        subtitle={<Skeleton sx={{ maxWidth: "100%" }} width={200} />}
        title={title}
      >
        <Stack spacing={2}>
          <LoadingSection>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Skeleton height={64} variant="rounded" width={64} />
              <Skeleton width="55%" />
            </Stack>
            <Skeleton height={56} variant="rounded" />
            <Stack direction="row" spacing={1}>
              <Skeleton height={40} sx={{ flex: 1 }} variant="rounded" />
              <Skeleton height={40} variant="rounded" width={96} />
            </Stack>
            <Skeleton width="75%" />
            <Box sx={typeGridSx}>
              {Array.from({ length: accountTypeCount }, (_, index) => (
                <Skeleton height={72} key={index} variant="rounded" />
              ))}
            </Box>
          </LoadingSection>

          <LoadingSection>
            <Stack direction="row" spacing={1.5}>
              <Skeleton height={56} variant="rounded" width="38%" />
              <Skeleton height={56} sx={{ flex: 1 }} variant="rounded" />
            </Stack>
          </LoadingSection>

          <LoadingSection>
            <Stack direction="row" spacing={1.5}>
              {Array.from({ length: holderAvatarCount }, (_, index) => (
                <Skeleton
                  height={56}
                  key={index}
                  variant="circular"
                  width={56}
                />
              ))}
            </Stack>
          </LoadingSection>

          <Stack direction="row" spacing={1.5}>
            <Skeleton height={40} sx={actionSkeletonSx} variant="rounded" />
            <Skeleton height={40} sx={actionSkeletonSx} variant="rounded" />
          </Stack>
        </Stack>
      </SettingsPageLayout>
    </Box>
  );
}

function LoadingSection({ children }: { children: ReactNode }) {
  return (
    <SectionCard sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Skeleton sx={{ fontSize: 18 }} width={88} />
        {children}
      </Stack>
    </SectionCard>
  );
}

const typeGridSx = {
  display: "grid",
  gap: 1,
  gridTemplateColumns: `repeat(${accountTypeCount}, minmax(0, 1fr))`,
};

const actionSkeletonSx = {
  borderRadius: `${designTokens.radius.full}px`,
  flex: 1,
};
