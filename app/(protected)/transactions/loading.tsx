import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { LoadingState } from "molecules/ui/LoadingState";

export default function TransactionsLoadingPage() {
  return (
    <Stack spacing={2.2}>
      <Typography component="h1" sx={{ fontSize: 24, fontWeight: 900 }}>
        明细
      </Typography>
      <LoadingState title="正在读取明细数据" />
    </Stack>
  );
}
