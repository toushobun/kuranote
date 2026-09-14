import Chip from "@mui/material/Chip";

import { designTokens } from "theme/theme";
import { userThemeCardBorderSx } from "theme/userThemeCardSx";

type TransactionFilterChipProps = {
  label: string;
  selected?: boolean;
  onClick: () => void;
};

export function TransactionFilterChip({
  label,
  selected = false,
  onClick,
}: TransactionFilterChipProps) {
  return (
    <Chip
      clickable
      aria-pressed={selected}
      label={label}
      onClick={onClick}
      sx={[chipSx, ...(selected ? [selectedChipSx] : [])]}
    />
  );
}

const chipSx = {
  "@media (hover: hover)": {
    "&&.MuiChip-clickable:hover": {
      bgcolor: "var(--user-theme-badge-bg)",
    },
  },
  "@media (hover: none)": {
    "&&.MuiChip-clickable": { bgcolor: "var(--user-theme-card-bg)" },
  },
  bgcolor: "var(--user-theme-card-bg)",
  ...userThemeCardBorderSx,
  borderRadius: `${designTokens.radius.item}px`,
  color: "text.primary",
  fontSize: 12,
  fontWeight: 800,
  height: 34,
  px: 0.4,
};

const selectedChipSx = {
  "@media (hover: none)": {
    "&&.MuiChip-clickable": {
      bgcolor: "var(--user-theme-field-card-selected-bg)",
    },
  },
  bgcolor: "var(--user-theme-field-card-selected-bg)",
  borderColor: "var(--user-theme-action-bg)",
  color: "var(--user-theme-action-bg)",
};
