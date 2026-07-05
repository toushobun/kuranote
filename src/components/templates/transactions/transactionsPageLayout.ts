import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { designTokens } from "theme/theme";

export const transactionPageFrameSx = {
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

export const transactionPageContentSx = {
  maxWidth: "900px",
  mx: "auto",
};
