import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { designTokens } from "theme/theme";
import { TransactionsSkeleton } from "templates/transactions/TransactionsSkeleton";

export default function TransactionsLoadingPage() {
  return (
    <Box
      role="status"
      aria-label="页面数据加载中"
      aria-busy="true"
      sx={pageFrameSx}
    >
      <Stack spacing={2.2} sx={pageContentSx}>
        <Stack direction="row" sx={headerSx}>
          <Typography component="h1" sx={{ fontSize: 24, fontWeight: 900 }}>
            小票明细
          </Typography>

          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="circular" width={40} height={40} />
          </Stack>
        </Stack>

        <TransactionsSkeleton />
      </Stack>
    </Box>
  );
}

const pageFrameSx = {
  bgcolor: "var(--user-theme-tx-page-bg)",
  mb: bottomNavigationLayout.shellPaddingBottomOffset,
  minHeight: "100dvh",
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

const pageContentSx = {
  maxWidth: "900px",
  mx: "auto",
};

const headerSx = {
  alignItems: "center",
  justifyContent: "space-between",
};
