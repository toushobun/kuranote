import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { TransactionBusinessBadge } from "../TransactionBusinessBadge/TransactionBusinessBadge";
import {
  transactionBusinessBadgeConfig,
  transactionBusinessBadgeStatuses,
  type TransactionBusinessBadgeStatus,
  type TransactionSpecialStatusValue,
} from "../TransactionBusinessBadge/transactionBusinessBadgeConfig";

type TransactionSpecialStatusSelectorProps = {
  disabled?: boolean;
  onChange: (value: TransactionSpecialStatusValue) => void;
  onRetry?: () => void;
  state?: "error" | "loading" | "ready";
  value: TransactionSpecialStatusValue;
};

export function TransactionSpecialStatusSelector({
  disabled = false,
  onChange,
  onRetry,
  state = "ready",
  value,
}: TransactionSpecialStatusSelectorProps) {
  const isEnabled = value !== null;

  return (
    <Stack component="section" spacing={1} sx={selectorSx}>
      <Stack direction="row" sx={headerSx}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h3" sx={titleSx}>
            状态标签
          </Typography>
          <Typography color="text.secondary" variant="body2">
            只标记当前这条明细，角落徽标仅用于展示。
          </Typography>
        </Box>
        <Switch
          checked={isEnabled}
          disabled={disabled || state !== "ready"}
          onChange={(event) =>
            onChange(event.target.checked ? "pendingReimbursement" : null)
          }
          slotProps={{ input: { "aria-label": "启用状态标签" } }}
        />
      </Stack>

      {state === "loading" ? (
        <Stack aria-live="polite" direction="row" role="status" sx={stateSx}>
          <CircularProgress size={20} />
          <Typography color="text.secondary" variant="body2">
            正在加载状态标签…
          </Typography>
        </Stack>
      ) : null}

      {state === "error" ? (
        <Alert
          action={
            onRetry ? (
              <Button color="inherit" onClick={onRetry} size="small">
                重试
              </Button>
            ) : undefined
          }
          severity="error"
        >
          状态标签加载失败，请稍后重试。
        </Alert>
      ) : null}

      {state === "ready" && isEnabled ? (
        <RadioGroup
          aria-label="状态标签"
          onChange={(event) =>
            onChange(event.target.value as TransactionBusinessBadgeStatus)
          }
          value={value}
        >
          {transactionBusinessBadgeStatuses.map((status) => {
            const config = transactionBusinessBadgeConfig[status];
            return (
              <StatusOption
                badge={<TransactionBusinessBadge status={status} />}
                description={config.description}
                disabled={disabled}
                key={status}
                label={config.label}
                value={status}
              />
            );
          })}
        </RadioGroup>
      ) : null}
    </Stack>
  );
}

function StatusOption({
  badge,
  description,
  disabled,
  label,
  value,
}: {
  badge?: ReactNode;
  description: string;
  disabled: boolean;
  label: string;
  value: string;
}) {
  return (
    <FormControlLabel
      control={<Radio size="small" />}
      disabled={disabled}
      label={
        <Stack direction="row" spacing={1} sx={optionContentSx}>
          <Box sx={{ minWidth: 82 }}>{badge ?? label}</Box>
          <Typography color="text.secondary" variant="caption">
            {description}
          </Typography>
        </Stack>
      }
      value={value}
      sx={optionSx}
    />
  );
}

const selectorSx = {
  borderTop: 1,
  borderColor: "divider",
  mt: 1.5,
  pt: 1.5,
};

const titleSx = { fontSize: "0.95rem", fontWeight: 800 };

const headerSx = { alignItems: "center", gap: 1 };

const stateSx = {
  alignItems: "center",
  minHeight: 88,
  justifyContent: "center",
  gap: 1,
};

const optionSx = {
  alignItems: "center",
  borderRadius: 1.5,
  m: 0,
  minHeight: 48,
  px: 0.5,
  width: "100%",
  "&:has(.Mui-checked)": {
    bgcolor: "var(--user-theme-field-card-selected-bg)",
  },
};

const optionContentSx = {
  alignItems: "center",
  justifyContent: "space-between",
  py: 0.5,
  width: "100%",
};
