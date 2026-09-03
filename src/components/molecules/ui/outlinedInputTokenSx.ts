import { designTokens } from "theme/theme";

export const outlinedInputTokenSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "var(--user-theme-card-bg)",
    borderRadius: `${designTokens.radius.lg}px`,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--user-theme-card-border)",
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--user-theme-field-card-selected-border)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--user-theme-field-card-selected-border)",
    borderWidth: 1,
  },
} as const;
