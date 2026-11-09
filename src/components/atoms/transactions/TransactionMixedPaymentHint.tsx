import Typography from "@mui/material/Typography";
import { transactionPaymentFieldsMessages } from "utils/transactionMessages";

export function TransactionMixedPaymentHint() {
  return (
    <Typography
      variant="caption"
      color="textSecondary"
      sx={{ display: "block", textAlign: "center", py: 1 }}
    >
      {transactionPaymentFieldsMessages.mixedPaymentHint}
    </Typography>
  );
}
