import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { TransactionsSkeleton } from "templates/transactions/TransactionsSkeleton";
import {
  transactionPageContentSx,
  transactionPageFrameSx,
} from "templates/transactions/transactionsPageLayout";

export default function TransactionsLoadingPage() {
  return (
    <Box
      role="status"
      aria-label="页面数据加载中"
      aria-busy="true"
      sx={transactionPageFrameSx}
    >
      <Stack spacing={2.2} sx={transactionPageContentSx}>
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

const headerSx = {
  alignItems: "center",
  justifyContent: "space-between",
};
