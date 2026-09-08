import type { Theme } from "@mui/material/styles";

import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";

export function getMerchantFeedbackBottomOffset(theme: Theme): string {
  return `calc(${bottomNavigationLayout.shellPaddingBottom} + ${theme.spacing(1)})`;
}
