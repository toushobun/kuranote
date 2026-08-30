"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { CreateButton } from "atoms/ui/CreateButton";
import { routePaths } from "config/paths";
import { SectionCard } from "molecules/ui/SectionCard";
import { MerchantList } from "organisms/merchants/MerchantList/MerchantList";
import { PageShell } from "templates/layout/PageShell";
import type { Merchant } from "types/merchants";

export type MerchantsTemplateProps = {
  canManageMerchants?: boolean;
  keyword: string;
  ledgerId: string;
  ledgerName: string;
  merchants: Merchant[];
};

export function MerchantsTemplate({
  canManageMerchants = true,
  keyword,
  ledgerId,
  merchants,
}: MerchantsTemplateProps) {
  const hasMerchants = merchants.length > 0;
  const hasKeyword = keyword.trim().length > 0;

  return (
    <>
      <Box
        aria-hidden
        data-testid="merchants-page-background"
        sx={{
          backgroundColor: "background.default",
          inset: 0,
          position: "fixed",
          zIndex: -1,
        }}
      />
      <PageShell
        maxWidth="sm"
        sx={{ pb: { xs: 3, sm: 5 }, pt: { xs: 2, sm: 4 } }}
      >
        <Stack spacing={{ xs: 2, sm: 2.5 }}>
          <Stack
            direction="row"
            spacing={1.25}
            sx={{ alignItems: "flex-start" }}
          >
            <IconButton
              aria-label="返回设置"
              component={Link}
              href={routePaths.settings}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 4px 14px rgba(91, 62, 34, 0.08)",
                flexShrink: 0,
              }}
            >
              <ArrowBackRoundedIcon />
            </IconButton>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                component="h1"
                variant="h5"
                sx={{
                  color: "var(--user-theme-balance-text)",
                  fontWeight: 900,
                  lineHeight: 1.25,
                }}
              >
                商家管理
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 0.25 }}
                variant="body2"
              >
                管理常用商家和头像信息
              </Typography>
            </Box>

            {canManageMerchants ? (
              <CreateButton href={routePaths.merchantsNew}>
                新增商家
              </CreateButton>
            ) : null}
          </Stack>

          {hasMerchants || hasKeyword ? (
            <SectionCard component="form" sx={{ borderRadius: 999, p: 0 }}>
              <TextField
                defaultValue={keyword}
                fullWidth
                name="q"
                placeholder="搜索商家名称"
                size="small"
                slotProps={{
                  htmlInput: { "aria-label": "搜索商家" },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-notchedOutline": { border: 0 },
                  "& .MuiOutlinedInput-root": { borderRadius: 999, px: 0.75 },
                }}
              />
            </SectionCard>
          ) : null}

          <MerchantList
            canManageMerchants={canManageMerchants}
            createHref={routePaths.merchantsNew}
            keyword={keyword}
            ledgerId={ledgerId}
            merchants={merchants}
          />
        </Stack>
      </PageShell>
    </>
  );
}
