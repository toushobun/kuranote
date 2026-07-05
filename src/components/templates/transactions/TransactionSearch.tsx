"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { routePaths } from "config/paths";
import { TransactionRow } from "molecules/transactions/TransactionRow";
import {
  TransactionSearchIllustration,
  type TransactionSearchIllustrationVariant,
} from "molecules/transactions/TransactionSearchIllustration";
import type {
  TransactionListItem,
  TransactionSearchPage,
} from "types/transactions";

import { TransactionsSkeleton } from "./TransactionsSkeleton";
import {
  transactionPageContentSx,
  transactionPageFrameSx,
} from "./transactionsPageLayout";
import { useTransactionSearch } from "./useTransactionSearch";

export type TransactionSearchTemplateProps = {
  errorMessage: string | null;
  initialPage: TransactionSearchPage;
  initialQuery: string;
  isLoading?: boolean;
  loadSearchPageAction?: (
    query: string,
    offset: number,
  ) => Promise<TransactionSearchPage>;
};

export function TransactionSearchTemplate({
  errorMessage,
  initialPage,
  initialQuery,
  isLoading = false,
  loadSearchPageAction,
}: TransactionSearchTemplateProps) {
  const search = useTransactionSearch({
    initialPage,
    initialQuery,
    loadSearchPageAction,
  });

  return (
    <Box sx={transactionPageFrameSx}>
      <Stack spacing={2.2} sx={transactionPageContentSx}>
        <Stack direction="row" sx={searchHeaderSx}>
          <IconButton
            aria-label="返回明细页"
            component={Link}
            href={routePaths.transactions}
            sx={headerActionSx}
          >
            <ArrowBackRoundedIcon />
          </IconButton>

          <Box
            component="form"
            onSubmit={search.submitSearch}
            sx={searchFormSx}
          >
            <SearchRoundedIcon sx={searchIconSx} />
            <InputBase
              autoFocus
              fullWidth
              inputProps={{ "aria-label": searchText.inputLabel }}
              onChange={(event) => search.setInputValue(event.target.value)}
              placeholder={searchText.placeholder}
              sx={searchInputSx}
              value={search.inputValue}
            />
            {search.inputValue ? (
              <IconButton
                aria-label="清除搜索词"
                onClick={search.clearSearch}
                size="small"
                sx={clearButtonSx}
              >
                <CancelRoundedIcon fontSize="small" />
              </IconButton>
            ) : null}
          </Box>

          <Button
            component={Link}
            href={routePaths.transactions}
            sx={cancelButtonSx}
          >
            取消
          </Button>
        </Stack>

        {isLoading ? (
          <SearchLoadingState />
        ) : errorMessage ? (
          <SearchErrorState errorMessage={errorMessage} />
        ) : !search.hasSubmittedQuery ? (
          <SearchEmptyState
            description={searchText.guideDescription}
            illustrationVariant="guide"
            title={searchText.guideTitle}
          />
        ) : search.items.length === 0 ? (
          <SearchEmptyState
            description={searchText.noResultDescription}
            illustrationVariant="empty"
            title={searchText.noResultTitle}
          />
        ) : (
          <Stack spacing={1.3}>
            <Typography sx={resultCountSx}>
              共 {search.totalCount} 条结果
            </Typography>
            <SearchResultList
              getEditHref={search.getEditHref}
              items={search.items}
            />

            {search.nextOffset !== null ? (
              <Button
                disabled={search.isPending}
                onClick={search.loadMoreResults}
                sx={loadMoreButtonSx}
              >
                {search.isPending ? <CircularProgress size={18} /> : "加载更多"}
              </Button>
            ) : null}

            {search.loadMoreError ? (
              <Typography color="error" sx={loadMoreErrorSx}>
                {search.loadMoreError}
              </Typography>
            ) : null}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

function SearchResultList({
  getEditHref,
  items,
}: {
  getEditHref: (item: TransactionListItem) => string;
  items: TransactionListItem[];
}) {
  return (
    <Box>
      {items.map((item, itemIndex) => {
        const isLastItem = itemIndex === items.length - 1;

        return (
          <Box
            key={item.id}
            component={Link}
            href={getEditHref(item)}
            sx={{
              borderBottom: isLastItem
                ? "none"
                : "1px solid var(--user-theme-card-border)",
              color: "inherit",
              display: "block",
              outline: "none",
              textDecoration: "none",
              WebkitTapHighlightColor: "transparent",
              "&:focus-visible": {
                outline: "2px solid var(--user-theme-action-text)",
                outlineOffset: "-2px",
              },
            }}
          >
            <TransactionRow item={item} showAccount showTime showRecorder />
          </Box>
        );
      })}
    </Box>
  );
}

function SearchEmptyState({
  description,
  illustrationVariant,
  title,
}: {
  description: string;
  illustrationVariant: TransactionSearchIllustrationVariant;
  title: string;
}) {
  return (
    <Stack spacing={1.2} sx={emptyStateSx}>
      <TransactionSearchIllustration variant={illustrationVariant} />
      <Typography sx={emptyTitleSx}>{title}</Typography>
      <Typography sx={emptyDescriptionSx}>{description}</Typography>
    </Stack>
  );
}

function SearchLoadingState() {
  return (
    <Stack
      aria-busy="true"
      aria-label="搜索结果加载中"
      role="status"
      spacing={1.3}
      sx={loadingStateSx}
    >
      <Typography sx={emptyDescriptionSx}>搜索中...</Typography>
      <TransactionsSkeleton />
    </Stack>
  );
}

function SearchErrorState({ errorMessage }: { errorMessage: string }) {
  return (
    <Stack spacing={1.2} sx={emptyStateSx}>
      <Typography sx={emptyTitleSx}>搜索读取失败</Typography>
      <Typography sx={emptyDescriptionSx}>{errorMessage}</Typography>
      <Button onClick={() => globalThis.location.reload()} sx={pillButtonSx}>
        重新读取
      </Button>
    </Stack>
  );
}

const searchText = {
  guideDescription: "支持按商家名、备注、金额、成员搜索",
  guideTitle: "输入关键词，快速查找流水",
  inputLabel: "搜索关键词",
  noResultDescription: "换个关键词试试看吧",
  noResultTitle: "没有找到相关流水",
  placeholder: "商家、备注、金额、成员",
} as const;

const searchHeaderSx = {
  alignItems: "center",
  gap: 0.8,
};

const headerActionSx = {
  color: "text.primary",
  flexShrink: 0,
  height: 38,
  p: 0,
  width: 38,
  "&:hover": {
    bgcolor: "var(--user-theme-badge-bg)",
  },
};

const searchFormSx = {
  alignItems: "center",
  bgcolor: "background.paper",
  border: "1px solid var(--user-theme-card-border)",
  borderRadius: 999,
  display: "flex",
  flex: 1,
  gap: 0.8,
  minWidth: 0,
  px: 1.2,
  py: 0.45,
};

const searchIconSx = {
  color: "text.secondary",
  flexShrink: 0,
  fontSize: 19,
};

const searchInputSx = {
  flex: 1,
  fontSize: 14,
  fontWeight: 700,
  minWidth: 0,
  "& .MuiInputBase-input": {
    py: 0.1,
  },
};

const clearButtonSx = {
  color: "text.secondary",
  flexShrink: 0,
  height: 28,
  p: 0,
  width: 28,
};

const cancelButtonSx = {
  color: "var(--user-theme-action-text)",
  flexShrink: 0,
  fontWeight: 900,
  minWidth: "auto",
  px: 0.5,
};

const resultCountSx = {
  color: "text.secondary",
  fontSize: 13,
  fontWeight: 800,
};

const emptyStateSx = {
  alignItems: "center",
  minHeight: "calc(100dvh - 260px)",
  pt: { xs: 9, sm: 11 },
  textAlign: "center",
};

const emptyTitleSx = {
  color: "var(--user-theme-tx-name)",
  fontSize: 18,
  fontWeight: 900,
};

const emptyDescriptionSx = {
  color: "text.secondary",
  fontSize: 13,
  fontWeight: 700,
};

const loadingStateSx = {
  minHeight: "calc(100dvh - 220px)",
};

const pillButtonSx = {
  bgcolor: "var(--user-theme-action-bg)",
  borderRadius: 999,
  color: "var(--user-theme-action-text)",
  fontWeight: 900,
  px: 2.4,
  "&:hover": {
    bgcolor: "var(--user-theme-field-card-selected-bg)",
  },
};

const loadMoreButtonSx = {
  alignSelf: "center",
  borderRadius: 999,
  color: "var(--user-theme-action-text)",
  fontWeight: 900,
  minWidth: 120,
};

const loadMoreErrorSx = {
  fontSize: 12,
  fontWeight: 800,
};
