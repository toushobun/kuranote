"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { routePaths } from "config/paths";
import { SectionCard } from "molecules/ui/SectionCard";
import { MerchantTagManager } from "organisms/merchants/MerchantTagManager/MerchantTagManager";
import { PageShell } from "templates/layout/PageShell";
import { fullViewportPageBackgroundSx } from "templates/layout/fullViewportPageBackgroundSx";
import { designTokens } from "theme/theme";
import type {
  MerchantTag,
  MerchantTagReorderAction,
  MerchantTagStateAction,
} from "types/merchants";

export type MerchantTagsTemplateProps = {
  archiveAction: MerchantTagStateAction;
  createAction: MerchantTagStateAction;
  reorderAction: MerchantTagReorderAction;
  tags: MerchantTag[];
  updateAction: MerchantTagStateAction;
};

export function MerchantTagsTemplate({
  archiveAction,
  createAction,
  reorderAction,
  tags,
  updateAction,
}: MerchantTagsTemplateProps) {
  return (
    <>
      <Box aria-hidden sx={fullViewportPageBackgroundSx} />
      <PageShell
        maxWidth="sm"
        sx={{ pb: { xs: 3, sm: 5 }, pt: { xs: 2, sm: 4 } }}
      >
        <Stack spacing={{ xs: 2, sm: 2.5 }}>
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="h1"
                sx={{
                  color: "var(--user-theme-balance-text)",
                  fontWeight: 900,
                }}
                variant="h5"
              >
                商家标签管理
              </Typography>
              <Typography color="text.secondary" variant="body2">
                新增、编辑或调整商家标签顺序
              </Typography>
            </Box>
            <Button
              component={Link}
              href={routePaths.merchants}
              sx={{
                borderRadius: `${designTokens.radius.full}px`,
                flexShrink: 0,
              }}
              variant="outlined"
            >
              完成
            </Button>
          </Stack>

          <SectionCard sx={{ p: { xs: 1.5, sm: 2 } }}>
            <MerchantTagManager
              archiveAction={archiveAction}
              createAction={createAction}
              mode="management"
              reorderAction={reorderAction}
              tags={tags}
              updateAction={updateAction}
            />
          </SectionCard>
        </Stack>
      </PageShell>
    </>
  );
}
