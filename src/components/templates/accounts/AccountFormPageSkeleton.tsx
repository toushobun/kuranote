import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import type { ReactNode } from "react";

import { DataItemCard } from "atoms/ui/DataItemCard";
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

/** 新增 / 编辑账户页面的加载骨架，与页面同结构：预览卡片 → 基本信息 → 金额 → 持有人 → 底部按钮。 */
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
          <Stack spacing={1}>
            <Skeleton sx={{ fontSize: 14 }} width={40} />
            <Box sx={previewFrameSx}>
              <DataItemCard>
                <Stack
                  direction="row"
                  spacing={1.25}
                  sx={{ alignItems: "center" }}
                >
                  <Skeleton height={38} variant="rounded" width={38} />
                  <Stack spacing={0.5} sx={{ flex: 1 }}>
                    <Skeleton sx={{ fontSize: 17 }} width="56%" />
                    <Skeleton sx={{ fontSize: 14 }} width="36%" />
                  </Stack>
                  <Skeleton sx={{ fontSize: 17 }} width={72} />
                </Stack>
              </DataItemCard>
            </Box>
          </Stack>

          <LoadingSection>
            <Skeleton height={56} variant="rounded" />
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

const previewFrameSx = {
  border: "2px dashed",
  borderColor: "divider",
  borderRadius: `${designTokens.radius.lg}px`,
  p: 0.5,
};

const typeGridSx = {
  display: "grid",
  gap: 1,
  gridTemplateColumns: `repeat(${accountTypeCount}, minmax(0, 1fr))`,
};

const actionSkeletonSx = {
  borderRadius: `${designTokens.radius.full}px`,
  flex: 1,
};
