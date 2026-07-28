import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { designTokens } from "theme/theme";
import { userThemeCardBorderSx } from "theme/userThemeCardSx";

export function TransactionFilterResultSummary({
  chips,
  hasActiveFilters,
  label,
  onClear,
}: {
  chips: string[];
  hasActiveFilters: boolean;
  label: string;
  onClear: () => void;
}) {
  return (
    <Stack spacing={1} sx={filterResultSx}>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
        <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 900 }}>
          {label}
        </Typography>
        {hasActiveFilters ? (
          <Button onClick={onClear} size="small" sx={clearButtonSx}>
            清除
          </Button>
        ) : null}
      </Stack>
      {chips.length > 0 ? (
        <Stack
          direction="row"
          spacing={0.8}
          sx={{ flexWrap: "wrap", rowGap: 0.8 }}
        >
          {chips.map((chip) => (
            <Chip key={chip} label={chip} size="small" sx={resultChipSx} />
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}

export function TransactionFilterResultSummarySkeleton({
  chipCount,
  hasActiveFilters,
}: {
  chipCount: number;
  hasActiveFilters: boolean;
}) {
  return (
    <Stack
      aria-busy="true"
      aria-label="筛选结果加载中"
      role="status"
      spacing={1}
      sx={filterResultSx}
    >
      <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
        <Skeleton width={120} sx={{ flex: 1, fontSize: 13 }} />
        {hasActiveFilters ? (
          <Skeleton width={34} sx={{ fontSize: 13 }} />
        ) : null}
      </Stack>
      {chipCount > 0 ? (
        <Stack
          direction="row"
          spacing={0.8}
          sx={{ flexWrap: "wrap", rowGap: 0.8 }}
        >
          {Array.from({ length: chipCount }).map((_, index) => (
            <Skeleton
              key={index}
              height={32}
              variant="rounded"
              width={64}
              sx={resultChipSkeletonSx}
            />
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}

const filterResultSx = {
  bgcolor: "var(--user-theme-filter-summary-bg)",
  ...userThemeCardBorderSx,
  borderRadius: `${designTokens.radius.sm}px`,
  px: 1.5,
  py: 1.25,
};

const clearButtonSx = {
  color: "var(--user-theme-action-text)",
  fontSize: 13,
  fontWeight: 900,
  minHeight: 28,
  minWidth: "auto",
  p: 0,
};

const resultChipSx = {
  bgcolor: "background.paper",
  ...userThemeCardBorderSx,
  borderRadius: `${designTokens.radius.sm}px`,
  boxShadow: 1,
  fontSize: 12,
  fontWeight: 800,
  height: 32,
  "& .MuiChip-label": {
    px: 1.5,
  },
};

const resultChipSkeletonSx = {
  borderRadius: `${designTokens.radius.sm}px`,
};
