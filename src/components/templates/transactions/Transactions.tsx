"use client";

import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
import { TransactionFilterResultSummary } from "./TransactionFilterResultSummary";
import { TransactionsSkeleton } from "./TransactionsSkeleton";
import { useTransactions } from "./useTransactions";

export type TransactionSaveResult = "created" | "updated";

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
  const [activeSaveResult, setActiveSaveResult] = useState(saveResult);
  const initialSaveResultRef = useRef(activeSaveResult);
  const router = useRouter();

  useEffect(() => {
    if (initialSaveResultRef.current) {
      window.scrollTo({ top: 0 });
    }
  }, []);
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

  function closeSaveSuccessDialog() {
    setActiveSaveResult(null);

    const url = new URL(window.location.href);
    url.searchParams.delete("result");
    router.replace(`${url.pathname}${url.search}${url.hash}`, {
      scroll: false,
    });
  }

  const saveSuccessDialogText =
    saveSuccessDialogTextByResult[activeSaveResult ?? "updated"];

  return (
    <Stack spacing={2.2} sx={pageContentSx}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography component="h1" sx={{ fontSize: 24, fontWeight: 900 }}>
          小票明细
        </Typography>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <IconButton aria-label="搜索" sx={headerActionSx}>
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

      {displayLoading ? (
        <TransactionsSkeleton />
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
              onClear={clearFilters}
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
        description={saveSuccessDialogText.description}
        onClose={closeSaveSuccessDialog}
        open={activeSaveResult !== null}
        title={saveSuccessDialogText.title}
      />
    </Stack>
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
  updated: {
    description: "这条记录的修改已经保存。",
    title: "保存成功",
  },
};

const pageContentSx = {
  bgcolor: "var(--user-theme-tx-page-bg)",
  mb: bottomNavigationLayout.shellPaddingBottomOffset,
  minHeight: "100dvh",
  mt: -4,
  mx: {
    xs: -designTokens.spacing.page.mobile,
    sm: -designTokens.spacing.page.desktop,
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
