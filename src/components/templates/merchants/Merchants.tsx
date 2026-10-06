"use client";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useState } from "react";

import { CreateButton } from "atoms/ui/CreateButton";
import { merchantPageMessages, merchantText } from "config/merchantText";
import { routePaths } from "config/paths";
import { InlineHint } from "molecules/ui/InlineHint/InlineHint";
import { SuccessFeedbackDialog } from "molecules/ui/OperationFeedbackDialogs";
import { SectionCard } from "molecules/ui/SectionCard";
import { MerchantDisplayNameFeedback } from "organisms/merchants/MerchantDisplayNameFeedback/MerchantDisplayNameFeedback";
import { MerchantList } from "organisms/merchants/MerchantList/MerchantList";
import { MerchantTagManager } from "organisms/merchants/MerchantTagManager/MerchantTagManager";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import {
  SettingsPageLayout,
  settingsPageActionButtonSx,
} from "templates/layout/SettingsPageLayout";
import { useClearQueryParam } from "templates/useClearQueryParam";
import { designTokens } from "theme/theme";
import type {
  Merchant,
  MerchantTag,
  MerchantStateAction,
  MerchantTagReorderAction,
  MerchantReorderAction,
  MerchantTagStateAction,
} from "types/merchants";

import { useMerchantDisplayNameListAction } from "./useMerchantDisplayNameListAction";

export type MerchantsTemplateProps = {
  archiveAction: MerchantTagStateAction;
  canManageMerchants?: boolean;
  createAction: MerchantTagStateAction;
  keyword: string;
  ledgerId: string;
  merchants: Merchant[];
  setPreferredMerchantAliasAction: MerchantStateAction;
  saveResult?: "archived" | "created" | "updated" | null;
  selectedTag: MerchantTag | null;
  tagFilterError: string | null;
  tags: MerchantTag[];
  reorderMerchantsAction?: MerchantReorderAction;
  reorderAction: MerchantTagReorderAction;
  updateAction: MerchantTagStateAction;
};

type TagManagementView = "filter" | "management" | "closing";

export function MerchantsTemplate({
  archiveAction,
  canManageMerchants = true,
  createAction,
  keyword,
  ledgerId,
  merchants,
  saveResult = null,
  setPreferredMerchantAliasAction,
  selectedTag,
  tagFilterError,
  tags,
  reorderAction,
  reorderMerchantsAction,
  updateAction,
}: MerchantsTemplateProps) {
  const setPreferred = useMerchantDisplayNameListAction(
    setPreferredMerchantAliasAction,
  );
  const clearResultParam = useClearQueryParam("result");
  const [isSaveSuccessOpen, setIsSaveSuccessOpen] = useState(
    saveResult !== null,
  );

  function closeSaveSuccessDialog() {
    setIsSaveSuccessOpen(false);
    clearResultParam();
  }

  function submitPreferredAlias(formData: FormData) {
    if (isSaveSuccessOpen) {
      closeSaveSuccessDialog();
    }
    return setPreferred.action(formData);
  }

  const [tagManagementView, setTagManagementView] =
    useState<TagManagementView>("filter");
  const [hasOpenedTagManagement, setHasOpenedTagManagement] = useState(false);
  const [isTagManagementPending, setIsTagManagementPending] = useState(false);
  const isTagManagementExpanded =
    tagManagementView === "management" && canManageMerchants;
  const hasMerchants = merchants.length > 0;
  const normalizedKeyword = keyword.trim();
  const hasKeyword = normalizedKeyword.length > 0;
  const clearTagFilterHref = hasKeyword
    ? `${routePaths.merchants}?q=${encodeURIComponent(normalizedKeyword)}`
    : routePaths.merchants;

  function toggleTagManagement() {
    if (isTagManagementExpanded) {
      setTagManagementView("closing");
      return;
    }

    setHasOpenedTagManagement(true);
    setTagManagementView("management");
  }

  return (
    <>
      <SettingsPageLayout
        action={
          canManageMerchants ? (
            <CreateButton
              href={routePaths.merchantsNew}
              size="small"
              sx={settingsPageActionButtonSx}
            >
              {merchantText.create}
            </CreateButton>
          ) : null
        }
        back={{
          href: routePaths.settings,
          label: merchantPageMessages.backToSettings,
        }}
        subtitle={merchantPageMessages.subtitle}
        title={merchantPageMessages.title}
      >
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
                aria-expanded={isTagManagementExpanded}
                disabled={
                  isTagManagementPending || tagManagementView === "closing"
                }
                onClick={toggleTagManagement}
                size="small"
                startIcon={
                  isTagManagementExpanded ? undefined : (
                    <TuneRoundedIcon fontSize="small" />
                  )
                }
                sx={{
                  borderRadius: `${designTokens.radius.full}px`,
                  minHeight: (theme) => theme.spacing(4.5),
                  py: 0.5,
                }}
                variant="outlined"
              >
                {isTagManagementExpanded
                  ? merchantText.managementDone
                  : merchantText.manageTags}
              </Button>
            ) : null}
          </Stack>

          <Collapse
            in={!isTagManagementExpanded}
            timeout={designTokens.motion.collapse}
          >
            <Box
              aria-hidden={isTagManagementExpanded}
              inert={isTagManagementExpanded}
            >
              <MerchantTagManager
                keyword={keyword}
                selectedTagId={selectedTag?.id}
                tags={tags}
              />
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                  justifyContent: selectedTag ? "space-between" : "flex-start",
                  minHeight: 22,
                  mt: 1.5,
                }}
              >
                {selectedTag ? (
                  <Typography variant="body2">
                    当前筛选：{selectedTag.icon} {selectedTag.name} ·{" "}
                    {merchants.length} 个商家
                  </Typography>
                ) : tags.length > 0 ? (
                  <InlineHint variant="plain">
                    {merchantText.categoryFilterHint}
                  </InlineHint>
                ) : null}
                {selectedTag ? (
                  <Button
                    component={Link}
                    href={clearTagFilterHref}
                    size="small"
                    sx={{ minHeight: 0, py: 0 }}
                  >
                    清除筛选
                  </Button>
                ) : null}
              </Stack>
            </Box>
          </Collapse>
          {tagFilterError ? (
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
          {canManageMerchants || hasOpenedTagManagement ? (
            <Collapse
              in={isTagManagementExpanded}
              onExit={() => setTagManagementView("closing")}
              onExited={() => setTagManagementView("filter")}
              timeout={designTokens.motion.collapse}
            >
              <Box
                aria-hidden={!isTagManagementExpanded}
                data-testid="merchant-tag-management-panel"
                inert={!isTagManagementExpanded}
              >
                <MerchantTagManager
                  active={isTagManagementExpanded}
                  archiveAction={archiveAction}
                  createAction={createAction}
                  mode="management"
                  onPendingChange={setIsTagManagementPending}
                  reorderAction={reorderAction}
                  tags={tags}
                  updateAction={updateAction}
                />
              </Box>
            </Collapse>
          ) : null}
        </SectionCard>

        <Box
          sx={(theme) => ({
            mt: {
              xs: `${theme.spacing(1.5)} !important`,
              sm: `${theme.spacing(2)} !important`,
            },
          })}
        >
          <MerchantList
            canManageMerchants={canManageMerchants}
            createHref={routePaths.merchantsNew}
            keyword={keyword}
            ledgerId={ledgerId}
            merchants={merchants}
            reorderAction={reorderMerchantsAction}
            setPreferredAliasAction={submitPreferredAlias}
            tagFiltered={Boolean(selectedTag) || Boolean(tagFilterError)}
          />
        </Box>
      </SettingsPageLayout>
      <MerchantDisplayNameFeedback state={setPreferred.state} />
      <SuccessFeedbackDialog
        bottomOffset={bottomNavigationLayout.feedbackBottomOffset}
        onClose={closeSaveSuccessDialog}
        open={isSaveSuccessOpen}
        title={
          saveResult === "archived"
            ? merchantText.archiveSuccess
            : merchantText.saveSuccess
        }
      />
    </>
  );
}
