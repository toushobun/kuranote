import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { transactionOriginalAmountTextSx } from "theme/transactionAmountSx";
import { transactionAmountMessages } from "utils/transactionMessages";

type TransactionOriginalAmountProps = {
  amount: ReactNode;
  parenthesized?: boolean;
};

export function TransactionOriginalAmount({
  amount,
  parenthesized = false,
}: TransactionOriginalAmountProps) {
  const content = (
    <>
      {transactionAmountMessages.originalAmount} {amount}
    </>
  );

  return (
    <Typography
      component="span"
      sx={transactionOriginalAmountTextSx}
      variant="caption"
    >
      {parenthesized ? <>（{content}）</> : content}
    </Typography>
  );
}
