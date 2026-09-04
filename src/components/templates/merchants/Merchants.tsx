"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useState } from "react";

import { CreateButton } from "atoms/ui/CreateButton";
import { merchantText } from "config/merchantText";
import { routePaths } from "config/paths";
import { SectionCard } from "molecules/ui/SectionCard";
import { MerchantList } from "organisms/merchants/MerchantList/MerchantList";
import { MerchantTagManager } from "organisms/merchants/MerchantTagManager/MerchantTagManager";
import { PageShell } from "templates/layout/PageShell";
import { fullViewportPageBackgroundSx } from "templates/layout/fullViewportPageBackgroundSx";
import { designTokens } from "theme/theme";
import type {
  Merchant,
  MerchantTag,
  MerchantTagReorderAction,
  MerchantTagStateAction,
} from "types/merchants";

export type MerchantsTemplateProps = {
  archiveAction: MerchantTagStateAction;
  canManageMerchants?: boolean;
  createAction: MerchantTagStateAction;
  keyword: string;
  ledgerId: string;
  merchants: Merchant[];
  selectedTag: MerchantTag | null;
  tagFilterError: string | null;
  tags: MerchantTag[];
  reorderAction: MerchantTagReorderAction;
  updateAction: MerchantTagStateAction;
};

export function MerchantsTemplate({
  archiveAction,
  canManageMerchants = true,
  createAction,
  keyword,
  ledgerId,
  merchants,
  selectedTag,
  tagFilterError,
  tags,
  reorderAction,
  updateAction,
}: MerchantsTemplateProps) {
  const [isManagingTags, setIsManagingTags] = useState(false);
  const hasMerchants = merchants.length > 0;
  const normalizedKeyword = keyword.trim();
  const hasKeyword = normalizedKeyword.length > 0;
  const clearTagFilterHref = hasKeyword
    ? `${routePaths.merchants}?q=${encodeURIComponent(normalizedKeyword)}`
    : routePaths.merchants;

  return (
    <>
      <Box
        aria-hidden
        data-testid="merchants-page-background"
        sx={fullViewportPageBackgroundSx}
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
              <CreateButton
                href={routePaths.merchantsNew}
                size="small"
                sx={{
                  borderRadius: `${designTokens.radius.full}px`,
                  flexShrink: 0,
                  px: { xs: 1.5, sm: 2.5 },
                  whiteSpace: "nowrap",
                }}
              >
                新增商家
              </CreateButton>
            ) : null}
          </Stack>

          {hasMerchants || hasKeyword || selectedTag || tagFilterError ? (
            <SectionCard
              component="form"
              sx={{ borderRadius: `${designTokens.radius.full}px`, p: 0 }}
            >
              {selectedTag ? (
                <input name="tagId" type="hidden" value={selectedTag.id} />
              ) : null}
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
                  "& .MuiOutlinedInput-root": {
                    borderRadius: `${designTokens.radius.full}px`,
                    px: 0.75,
                  },
                }}
              />
            </SectionCard>
          ) : null}

          <SectionCard sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1.5,
              }}
            >
              <Typography component="h2" sx={{ fontWeight: 800 }} variant="h6">
                {merchantText.categoryManagement}
              </Typography>
              {canManageMerchants ? (
                <Button
                  aria-controls="merchant-tag-management"
                  aria-expanded={isManagingTags}
                  onClick={() => setIsManagingTags((expanded) => !expanded)}
                  size="small"
                  startIcon={
                    isManagingTags ? undefined : (
                      <TuneRoundedIcon fontSize="small" />
                    )
                  }
                  sx={{ borderRadius: `${designTokens.radius.full}px` }}
                  variant="outlined"
                >
                  {isManagingTags
                    ? merchantText.managementDone
                    : merchantText.manageTags}
                </Button>
              ) : null}
            </Stack>

            {!isManagingTags ? (
              <MerchantTagManager
                keyword={keyword}
                selectedTagId={selectedTag?.id}
                tags={tags}
              />
            ) : null}
            {!isManagingTags && selectedTag ? (
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                  borderTop: 1,
                  borderColor: "divider",
                  justifyContent: "space-between",
                  mt: 1.5,
                  pt: 1.5,
                }}
              >
                <Typography variant="body2">
                  当前筛选：{selectedTag.icon} {selectedTag.name} ·{" "}
                  {merchants.length} 个商家
                </Typography>
                <Button component={Link} href={clearTagFilterHref} size="small">
                  清除筛选
                </Button>
              </Stack>
            ) : null}
            {!isManagingTags && tagFilterError ? (
              <Alert
                action={
                  <Button
                    color="inherit"
                    component={Link}
                    href={clearTagFilterHref}
                    size="small"
                  >
                    清除筛选
                  </Button>
                }
                severity="warning"
                sx={{ mt: 1.5 }}
              >
                {tagFilterError}
              </Alert>
            ) : null}
            <Collapse
              id="merchant-tag-management"
              in={isManagingTags}
              timeout="auto"
              unmountOnExit
            >
              <MerchantTagManager
                archiveAction={archiveAction}
                createAction={createAction}
                mode="management"
                reorderAction={reorderAction}
                tags={tags}
                updateAction={updateAction}
              />
            </Collapse>
          </SectionCard>

          <MerchantList
            canManageMerchants={canManageMerchants}
            createHref={routePaths.merchantsNew}
            keyword={keyword}
            ledgerId={ledgerId}
            merchants={merchants}
            tagFiltered={Boolean(selectedTag) || Boolean(tagFilterError)}
          />
        </Stack>
      </PageShell>
    </>
  );
}
