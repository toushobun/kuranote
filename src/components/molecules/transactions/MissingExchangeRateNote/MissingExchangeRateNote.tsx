import Typography from "@mui/material/Typography";

import { exchangeRateMessages } from "config/exchangeRateMessages";

export type MissingExchangeRateNoteProps = {
  align?: "left" | "right";
  marginTop?: number;
  missingRateCount?: number;
};

/** 仅在交易记录缺少汇率时显示提醒。 */
export function MissingExchangeRateNote({
  align = "left",
  marginTop = 0,
  missingRateCount,
}: MissingExchangeRateNoteProps) {
  if (!missingRateCount) return null;

  return (
    <Typography
      color="textSecondary"
      sx={{ display: "block", mt: marginTop, textAlign: align }}
      variant="caption"
    >
      {exchangeRateMessages.missingRecordRates(missingRateCount)}
    </Typography>
  );
}
