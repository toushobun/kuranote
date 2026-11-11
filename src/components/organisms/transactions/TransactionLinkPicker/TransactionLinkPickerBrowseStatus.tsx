import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { transactionLinkPickerMessages } from "utils/transactionMessages";

/** 退款与报销共用首屏加载、失败和重试状态。 */
export function TransactionLinkPickerBrowseStatus({
  errorMessage,
  isLoading,
  onRetry,
}: {
  errorMessage: string;
  isLoading: boolean;
  onRetry?: () => void;
}) {
  if (isLoading) {
    return (
      <Stack spacing={1} sx={{ alignItems: "center", py: 4 }}>
        <CircularProgress size={24} />
        <Typography color="textSecondary" variant="body2">
          {transactionLinkPickerMessages.loading}
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={1} sx={{ alignItems: "center" }}>
      <Typography color="textSecondary">{errorMessage}</Typography>
      {onRetry ? (
        <Button onClick={onRetry} size="small">
          {transactionLinkPickerMessages.retry}
        </Button>
      ) : null}
    </Stack>
  );
}
