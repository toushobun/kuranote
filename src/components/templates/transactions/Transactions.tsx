"use client";

import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { routePaths } from "config/paths";
import { EmptyState } from "molecules/ui/EmptyState";
import { SuccessFeedbackDialog } from "molecules/ui/OperationFeedbackDialogs";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { TransactionMonthList } from "organisms/transactions/TransactionMonthList";
import { designTokens } from "theme/theme";
import type {
  TransactionFilterOptions,
  TransactionFilters,
  TransactionGroupBy,
  TransactionGroupPage,
  TransactionMonthPage,
  TransactionTimeGroupViewData,
} from "types/transactions";

import { TransactionFilterDialog } from "./TransactionFilterDialog";
import {
  TransactionFilterResultSummary,
  TransactionFilterResultSummarySkeleton,
} from "./TransactionFilterResultSummary";
import { TransactionsSkeleton } from "./TransactionsSkeleton";
import { useTransactions } from "./useTransactions";

export type TransactionSaveResult = "created" | "deleted" | "updated";

type TransactionsTemplateProps = {
  errorMessage: string | null;
  filterOptions?: TransactionFilterOptions;
  isLoading?: boolean;
  loadFilteredGroupItemsAction?: (
    groupBy: TransactionGroupBy,
    groupKey: string,
    offset: number,
    filters: TransactionFilters,
  ) => Promise<TransactionMonthPage>;
  loadFilteredGroupsAction?: (
    groupBy: TransactionGroupBy,
    offset: number,
    filters: TransactionFilters,
  ) => Promise<TransactionGroupPage>;
  loadGroupItemsAction?: (
    groupKey: string,
    offset: number,
  ) => Promise<TransactionMonthPage>;
  loadGroupViewAction?: (
    groupBy: TransactionGroupBy,
    filters: TransactionFilters,
  ) => Promise<TransactionTimeGroupViewData>;
  loadMoreGroupsAction?: (offset: number) => Promise<TransactionGroupPage>;
  saveResult?: TransactionSaveResult | null;
  timeGroupView: TransactionTimeGroupViewData;
};

export function TransactionsTemplate({
  errorMessage,
  filterOptions = emptyFilterOptions,
  isLoading = false,
  loadFilteredGroupItemsAction,
  loadFilteredGroupsAction,
  loadGroupItemsAction,
  loadGroupViewAction,
  loadMoreGroupsAction,
  saveResult = null,
  timeGroupView,
}: TransactionsTemplateProps) {
  const [activeSaveResult] = useState(saveResult);
  const [isSaveSuccessOpen, setIsSaveSuccessOpen] = useState(
    saveResult !== null,
  );
  const [isRemovingFilters, setIsRemovingFilters] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (activeSaveResult) {
      window.scrollTo({ top: 0 });
    }
  }, [activeSaveResult]);
  const {
    activeFilterChips,
    appliedFilterKey,
    clearFilters,
    closeFilterDialog,
    displayLoading,
    draftFilters,
    draftGroupBy,
    filterDialogErrorMessage,
    groupView,
    hasActiveDisplaySettings,
    hasActiveFilters,
    isFilterOpen,
    isPending,
    loadGroupItems,
    loadMoreGroups,
    loadingFilterChips,
    loadingHasActiveFilters,
    loadingResultLabel,
    onApplyDraftFilters,
    onChangeDraftFilters,
    onChangeDraftGroupBy,
    openFilterDialog,
    resetDraftFilters,
    resultLabel,
    showFilterEmptyState,
  } = useTransactions({
    filterOptions,
    isLoading,
    loadFilteredGroupItemsAction,
    loadFilteredGroupsAction,
    loadGroupItemsAction,
    loadGroupViewAction,
    loadMoreGroupsAction,
    timeGroupView,
  });

  useEffect(() => {
    setIsRemovingFilters(false);
  }, [appliedFilterKey, groupView.groupBy]);

  function closeSaveSuccessDialog() {
    setIsSaveSuccessOpen(false);

    const url = new URL(window.location.href);
    url.searchParams.delete("result");
    router.replace(`${url.pathname}${url.search}${url.hash}`, {
      scroll: false,
    });
  }

  function openSearchPage() {
    router.push(routePaths.transactionsSearch);
  }

  function removeFilters() {
    setIsRemovingFilters(true);
    clearFilters();
  }

  const saveSuccessDialogText =
    saveSuccessDialogTextByResult[activeSaveResult ?? "created"];
  const displayContentLoading = displayLoading || isRemovingFilters;
  const shouldShowLoadingSummary =
    Boolean(loadingResultLabel) && (isLoading || isFilterOpen);

  return (
    <Box sx={pageFrameSx}>
      <Stack spacing={2.2} sx={pageContentSx}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography component="h1" sx={{ fontSize: 24, fontWeight: 900 }}>
            小票明细
          </Typography>

          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <IconButton
              aria-label="搜索"
              onClick={openSearchPage}
              sx={headerActionSx}
            >
              <SearchRoundedIcon />
            </IconButton>
            <IconButton
              aria-label="筛选"
              onClick={openFilterDialog}
              sx={headerActionSx}
            >
              <Badge
                color="warning"
                invisible={!hasActiveDisplaySettings}
                overlap="circular"
                variant="dot"
              >
                <FilterAltOutlinedIcon />
              </Badge>
            </IconButton>
          </Stack>
        </Stack>

        {displayContentLoading ? (
          <Stack spacing={1.3}>
            {shouldShowLoadingSummary ? (
              <TransactionFilterResultSummarySkeleton
                chipCount={loadingFilterChips.length}
                hasActiveFilters={loadingHasActiveFilters}
              />
            ) : null}
            <TransactionsSkeleton />
          </Stack>
        ) : errorMessage ? (
          <EmptyState
            action={
              <Button
                onClick={() => globalThis.location.reload()}
                sx={{
                  bgcolor: "var(--user-theme-action-bg)",
                  borderRadius: 999,
                  color: "var(--user-theme-action-text)",
                  fontWeight: 900,
                  px: 2.4,
                  "&:hover": {
                    bgcolor: "var(--user-theme-field-card-selected-bg)",
                  },
                }}
                variant="contained"
              >
                重新读取
              </Button>
            }
            description={errorMessage}
            title="明细读取失败"
          />
        ) : (
          <>
            {resultLabel ? (
              <TransactionFilterResultSummary
                chips={activeFilterChips}
                hasActiveFilters={hasActiveFilters}
                label={resultLabel}
                onClear={removeFilters}
              />
            ) : null}
            {showFilterEmptyState ? (
              <EmptyState title="没有找到符合条件的流水。" />
            ) : (
              <TransactionMonthList
                key={`${groupView.groupBy}:${appliedFilterKey}:${groupView.groups
                  .map((group) => group.id)
                  .join("|")}`}
                loadGroupItemsAction={loadGroupItems}
                loadMoreGroupsAction={loadMoreGroups}
                timeGroupView={groupView}
              />
            )}
          </>
        )}

        <TransactionFilterDialog
          draftFilters={draftFilters}
          draftGroupBy={draftGroupBy}
          errorMessage={filterDialogErrorMessage}
          filterOptions={filterOptions}
          isPending={isPending}
          onApply={onApplyDraftFilters}
          onChangeFilters={onChangeDraftFilters}
          onChangeGroupBy={onChangeDraftGroupBy}
          onClose={closeFilterDialog}
          onReset={resetDraftFilters}
          open={isFilterOpen}
        />
        <SuccessFeedbackDialog
          bottomOffset={saveFeedbackBottomOffset}
          description={saveSuccessDialogText.description}
          onClose={closeSaveSuccessDialog}
          open={isSaveSuccessOpen}
          title={saveSuccessDialogText.title}
        />
      </Stack>
    </Box>
  );
}

const emptyFilterOptions: TransactionFilterOptions = {
  accounts: [],
  categories: [],
  members: [],
  merchants: [],
  tags: [],
};

const saveSuccessDialogTextByResult: Record<
  TransactionSaveResult,
  { description: string; title: string }
> = {
  created: {
    description: "这笔记账已经保存。",
    title: "记账成功",
  },
  deleted: {
    description: "这笔记账已经删除。",
    title: "删除成功",
  },
  updated: {
    description: "这条记录的修改已经保存。",
    title: "保存成功",
  },
};

const saveFeedbackBottomOffset = `calc(${bottomNavigationLayout.shellPaddingBottom} + 8px)`;

const pageFrameSx = {
  bgcolor: "var(--user-theme-tx-page-bg)",
  mb: bottomNavigationLayout.shellPaddingBottomOffset,
  minHeight: "100dvh",
  // AppShell Container 的 py: 4，此处用负 margin 抵消使明细页内容从顶部开始。
  mt: -4,
  mx: {
    xs: -designTokens.spacing.page.mobile,
    sm: "calc(50% - 50vw)",
  },
  px: {
    xs: designTokens.spacing.page.mobile,
    sm: designTokens.spacing.page.desktop,
  },
  pb: bottomNavigationLayout.shellPaddingBottom,
  pt: {
    xs: designTokens.spacing.page.mobile,
    sm: designTokens.spacing.page.desktop,
  },
  width: {
    xs: "calc(100% + 32px)",
    sm: "100vw",
  },
};

const pageContentSx = {
  maxWidth: "900px",
  mx: "auto",
};

const headerActionSx = {
  color: "text.primary",
  height: 40,
  p: 0,
  transition: "background-color 120ms ease, transform 120ms ease",
  width: 40,
  "&:hover": {
    bgcolor: "var(--user-theme-badge-bg)",
  },
  "&:active": {
    bgcolor: "var(--user-theme-field-card-selected-bg)",
    transform: "translateY(1px)",
  },
};
