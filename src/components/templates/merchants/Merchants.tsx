"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Link from "next/link";

import { routePaths } from "config/paths";
import { SectionCard } from "molecules/ui/SectionCard";
import { MerchantList } from "organisms/merchants/MerchantList/MerchantList";
import { PageHeader } from "templates/layout/PageHeader";
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
  ledgerName,
  merchants,
}: MerchantsTemplateProps) {
  const hasMerchants = merchants.length > 0;
  const hasKeyword = keyword.trim().length > 0;

  return (
    <PageShell
      maxWidth="sm"
      sx={{ pb: { xs: 3, sm: 5 }, pt: { xs: 2, sm: 4 } }}
    >
      <PageHeader
        action={
          canManageMerchants ? (
            <Button
              component={Link}
              href={routePaths.merchantsNew}
              size="small"
              startIcon={<AddRoundedIcon />}
              sx={{
                borderRadius: 999,
                flexShrink: 0,
                px: { xs: 1.5, sm: 2.5 },
                whiteSpace: "nowrap",
              }}
              variant="contained"
            >
              新增商家
            </Button>
          ) : null
        }
        leading={
          <IconButton
            aria-label="返回设置"
            component={Link}
            href={routePaths.settings}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 4px 14px rgba(91, 62, 34, 0.08)",
            }}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
        }
        subtitle={
          <Stack spacing={0.5}>
            <span>管理常用商家和头像信息</span>
            <span>当前账本：{ledgerName}</span>
          </Stack>
        }
        title="商家管理"
      />

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
    </PageShell>
  );
}
