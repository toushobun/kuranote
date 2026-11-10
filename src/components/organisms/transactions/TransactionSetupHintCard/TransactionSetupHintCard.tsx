import AddRoundedIcon from "@mui/icons-material/AddRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { transactionSetupHintMessages } from "config/transactionMessages";
import { designTokens } from "theme/theme";

import type { TransactionSetupHint } from "./transactionSetupHint";

type TransactionSetupHintCardProps = {
  addAccountHref: string;
  hint: TransactionSetupHint;
};

/** 记账前缺少账户时的提示卡片（目前只有账户周转使用）。 */
export function TransactionSetupHintCard({
  addAccountHref,
  hint,
}: TransactionSetupHintCardProps) {
  return (
    <Box component="section" aria-label={hint.title} sx={cardSx}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
        <Box aria-hidden sx={iconBadgeSx}>
          <InfoOutlinedIcon fontSize="small" />
        </Box>
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography component="h2" sx={titleSx}>
            {hint.title}
          </Typography>
          <Typography color="textSecondary" variant="body2">
            {hint.description}
          </Typography>
        </Stack>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 1.75 }}>
        <Button
          component={Link}
          fullWidth
          href={addAccountHref}
          startIcon={<AddRoundedIcon />}
          sx={actionButtonSx}
          variant="outlined"
        >
          {transactionSetupHintMessages.addAccount}
        </Button>
      </Stack>
    </Box>
  );
}

const cardSx = {
  bgcolor: "var(--user-theme-field-card-selected-bg)",
  border: "1px solid",
  borderColor:
    "color-mix(in srgb, var(--user-theme-field-card-selected-border) 18%, transparent)",
  borderRadius: `${designTokens.radius.lg}px`,
  p: 2,
};

const iconBadgeSx = {
  alignItems: "center",
  bgcolor:
    "color-mix(in srgb, var(--user-theme-field-card-selected-border) 16%, transparent)",
  borderRadius: "50%",
  color: "var(--user-theme-action-text)",
  display: "flex",
  flexShrink: 0,
  height: 36,
  justifyContent: "center",
  width: 36,
};

const titleSx = {
  fontSize: "0.9375rem",
  fontWeight: 800,
};

const actionButtonSx = {
  bgcolor: "var(--user-theme-card-bg)",
  borderColor:
    "color-mix(in srgb, var(--user-theme-field-card-selected-border) 45%, transparent)",
  borderRadius: `${designTokens.radius.full}px`,
  color: "var(--user-theme-action-text)",
  fontWeight: 800,
  minHeight: 44,
  "@media (hover: hover)": {
    "&:hover": {
      bgcolor: "var(--user-theme-card-bg)",
      borderColor: "var(--user-theme-field-card-selected-border)",
    },
  },
};
