import type { ReactNode } from "react";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  transactionFormStackSx,
  transactionSubmitButtonSx,
  transactionSummarySurfaceSx,
} from "organisms/transactions/TransactionForm.styles";

import { NewTransactionVisualFrame } from "./NewTransactionVisualFrame";

type TransactionFormSkeletonProps = {
  mode?: "new" | "edit";
  title: string;
};

export function TransactionFormSkeleton({
  mode = "new",
  title,
}: TransactionFormSkeletonProps) {
  return (
    <NewTransactionVisualFrame>
      <Box role="status" aria-label="页面数据加载中" aria-busy="true">
        <Stack spacing={0}>
          <TransactionFormTopBarSkeleton title={title} />
          <Skeleton
            variant="rounded"
            height={42}
            sx={typeNavigationSkeletonSx}
          />
          <Stack spacing={0} sx={transactionFormStackSx}>
            <TransactionFormFieldsSkeleton
              action={
                mode === "edit" ? (
                  <EditActionBarSkeleton />
                ) : (
                  <SubmitButtonSkeleton />
                )
              }
            />
          </Stack>
        </Stack>
      </Box>
    </NewTransactionVisualFrame>
  );
}

function TransactionFormFieldsSkeleton({ action }: { action: ReactNode }) {
  return (
    <>
      <SelectionFieldSkeleton />
      <SelectionFieldSkeleton />
      <TransactionItemsSkeleton />
      <TagsSkeleton />
      <NoteSkeleton />
      <DateTimeSkeleton />
      <SummarySkeleton />
      {action}
    </>
  );
}

function TransactionFormTopBarSkeleton({ title }: { title: string }) {
  return (
    <Box sx={topBarSx}>
      <Skeleton variant="circular" width={36} height={36} />
      <Typography component="h1" variant="h5" sx={titleSx}>
        {title}
      </Typography>
      <Box aria-hidden sx={{ width: 40 }} />
    </Box>
  );
}

function SelectionFieldSkeleton() {
  return (
    <Stack spacing={1}>
      <Skeleton width={48} sx={{ fontSize: "0.8125rem" }} />
      <Skeleton variant="rounded" height={52} sx={fieldSkeletonSx} />
    </Stack>
  );
}

function TransactionItemsSkeleton() {
  return (
    <Stack spacing={1}>
      <Skeleton width={72} sx={{ fontSize: "0.8125rem" }} />
      <Stack spacing={1} sx={itemCardSkeletonSx}>
        <Stack direction="row" sx={itemRowSx}>
          <Skeleton width="44%" sx={{ fontSize: "0.875rem" }} />
          <Skeleton width={72} sx={{ fontSize: "0.875rem" }} />
        </Stack>
        <Skeleton variant="rounded" height={42} sx={fieldSkeletonSx} />
      </Stack>
    </Stack>
  );
}

function TagsSkeleton() {
  return (
    <Stack spacing={1}>
      <Skeleton width={64} sx={{ fontSize: "0.8125rem" }} />
      <Stack direction="row" spacing={0.75}>
        {[0, 1, 2].map((index) => (
          <Skeleton
            key={index}
            variant="rounded"
            width={64}
            height={28}
            sx={{ borderRadius: 999 }}
          />
        ))}
      </Stack>
    </Stack>
  );
}

function NoteSkeleton() {
  return (
    <Stack spacing={1}>
      <Skeleton width={40} sx={{ fontSize: "0.8125rem" }} />
      <Skeleton variant="rounded" height={50} sx={fieldSkeletonSx} />
    </Stack>
  );
}

function DateTimeSkeleton() {
  return (
    <Stack spacing={1}>
      <Skeleton width={64} sx={{ fontSize: "0.8125rem" }} />
      <Stack direction="row" spacing={1}>
        <Skeleton variant="rounded" height={50} sx={dateTimeFieldSkeletonSx} />
        <Skeleton variant="rounded" height={50} sx={dateTimeFieldSkeletonSx} />
      </Stack>
    </Stack>
  );
}

function SummarySkeleton({ rowCount = 3 }: { rowCount?: number }) {
  return (
    <Box sx={transactionSummarySurfaceSx}>
      <Stack spacing={1}>
        <Skeleton width={72} sx={{ fontSize: "0.8125rem" }} />
        {Array.from({ length: rowCount }).map((_, index) => (
          <Stack key={index} direction="row" sx={itemRowSx}>
            <Skeleton width={52} sx={{ fontSize: "0.75rem" }} />
            <Skeleton width={96} sx={{ fontSize: "0.75rem" }} />
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function SubmitButtonSkeleton() {
  return (
    <Skeleton variant="rounded" height={48} sx={transactionSubmitButtonSx} />
  );
}

function EditActionBarSkeleton() {
  return (
    <Box sx={editActionBarSx}>
      <Skeleton variant="rounded" height={48} sx={editDeleteButtonSkeletonSx} />
      <SubmitButtonSkeleton />
    </Box>
  );
}

const topBarSx = {
  alignItems: "center",
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr) 40px",
  pb: 1.5,
  pt: { xs: 0, sm: 0.5 },
};

const titleSx = {
  color: "text.primary",
  fontSize: "1rem",
  fontWeight: 800,
  letterSpacing: 0,
  lineHeight: 1.25,
  textAlign: "center",
};

const typeNavigationSkeletonSx = {
  bgcolor: "var(--user-theme-segment-bg)",
  borderRadius: 2.5,
  mb: 1.75,
};

const fieldSkeletonSx = {
  bgcolor: "var(--user-theme-card-bg)",
  border: "1px solid var(--user-theme-card-border)",
  borderRadius: 1.25,
};

const itemCardSkeletonSx = {
  ...fieldSkeletonSx,
  p: 1.25,
};

const itemRowSx = {
  alignItems: "center",
  justifyContent: "space-between",
};

const dateTimeFieldSkeletonSx = {
  ...fieldSkeletonSx,
  flex: 1,
};

const editActionBarSx = {
  display: "grid",
  gap: 1.25,
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)",
  mt: 0.25,
};

const editDeleteButtonSkeletonSx = {
  borderRadius: 1.75,
};
