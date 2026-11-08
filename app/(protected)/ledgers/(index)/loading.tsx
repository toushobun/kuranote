import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

import { CreateButton } from "atoms/ui/CreateButton";
import { DataItemCard } from "atoms/ui/DataItemCard";
import { ledgerPageMessages } from "config/ledgerMessages";
import { routePaths } from "config/paths";
import {
  SettingsPageLayout,
  settingsPageActionButtonSx,
} from "templates/layout/SettingsPageLayout";

const ledgerLoadingRows = 4;

export default function LedgersLoadingPage() {
  return (
    <Box aria-busy="true" aria-label={ledgerPageMessages.loading} role="status">
      <SettingsPageLayout
        action={
          // 新增账本打开向导需要页面就绪，加载中显示禁用状态的同一按钮
          <CreateButton disabled size="small" sx={settingsPageActionButtonSx}>
            {ledgerPageMessages.create}
          </CreateButton>
        }
        back={{
          href: routePaths.settings,
          label: ledgerPageMessages.backToSettings,
        }}
        subtitle={ledgerPageMessages.subtitle}
        title={ledgerPageMessages.title}
      >
        <Stack spacing={2.1}>
          <DataItemCard>
            <Stack spacing={1.45}>
              <Stack
                direction="row"
                spacing={1.25}
                sx={{ alignItems: "center" }}
              >
                <Skeleton height={56} variant="circular" width={56} />
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Skeleton sx={{ fontSize: 14 }} width="24%" />
                  <Skeleton sx={{ fontSize: 24 }} width="62%" />
                </Stack>
                <Skeleton height={30} variant="rounded" width={72} />
              </Stack>
              <Skeleton />
              <Stack direction="row" spacing={1.5}>
                <Skeleton sx={{ fontSize: 14 }} width="30%" />
                <Skeleton sx={{ fontSize: 14 }} width="30%" />
                <Skeleton sx={{ fontSize: 14 }} width="30%" />
              </Stack>
            </Stack>
          </DataItemCard>

          <Stack spacing={0.8}>
            <Skeleton sx={{ fontSize: 18 }} width="38%" />
            {Array.from({ length: ledgerLoadingRows }, (_, index) => (
              <DataItemCard key={index}>
                <Stack
                  direction="row"
                  spacing={1.25}
                  sx={{ alignItems: "center" }}
                >
                  <Skeleton height={46} variant="circular" width={46} />
                  <Stack spacing={0.5} sx={{ flex: 1 }}>
                    <Skeleton sx={{ fontSize: 18 }} width="50%" />
                    <Skeleton sx={{ fontSize: 14 }} width="70%" />
                  </Stack>
                  <Skeleton height={26} variant="rounded" width={72} />
                </Stack>
              </DataItemCard>
            ))}
          </Stack>
        </Stack>
      </SettingsPageLayout>
    </Box>
  );
}
