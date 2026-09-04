import { primaryActionButtonNoHoverBrightenSx } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { designTokens } from "theme/theme";
import { userThemeCardBorderSx } from "theme/userThemeCardSx";

export const smallIconButtonSx = {
  color: "text.secondary",
  height: 40,
  width: 40,
};

export const transactionFormStackSx = {
  gap: 1.75,
};

export const transactionFieldGroupSx = {
  display: "grid",
  gap: 1,
};

export const transactionSectionTitleSx = {
  color: "text.primary",
  fontSize: "0.8125rem",
  fontWeight: 800,
  lineHeight: 1.2,
  px: 0.25,
};

export const transactionNoteFieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "var(--user-theme-card-bg)",
    borderRadius: `${designTokens.radius.md}px`,
    minHeight: 50,
    py: 0.75,
  },
  "& .MuiInputBase-inputMultiline": {
    py: 0,
  },
};

export const transactionSummarySurfaceSx = {
  bgcolor: "var(--user-theme-tx-summary-bg)",
  ...userThemeCardBorderSx,
  borderRadius: `${designTokens.radius.lg}px`,
  boxShadow: "none",
  px: 1.5,
  py: 1.25,
};

export const transactionSubmitButtonSx = {
  borderRadius: `${designTokens.radius.md}px`,
  fontSize: "1rem",
  fontWeight: 800,
  minHeight: 48,
  mt: 0.25,
  "&:not(.Mui-disabled)": {
    boxShadow: "0 8px 18px var(--user-theme-fab-shadow)",
  },
  ...primaryActionButtonNoHoverBrightenSx,
};
