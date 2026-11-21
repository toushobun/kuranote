import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { exchangeRateMessages } from "config/exchangeRateMessages";

export type ExchangeRateTotalsNoteProps = {
  align?: "left" | "right";
  hasForeignCurrency?: boolean;
  marginTop?: number;
  missingRateCount?: number;
};

/** 各合计画面统一显示外币换算说明与缺汇率笔数。 */
export function ExchangeRateTotalsNote({
  align = "left",
  hasForeignCurrency,
  marginTop = 0,
  missingRateCount,
}: ExchangeRateTotalsNoteProps) {
  if (!hasForeignCurrency && !missingRateCount) return null;
  return (
    <Stack spacing={0.2} sx={{ mt: marginTop, textAlign: align }}>
      {hasForeignCurrency ? (
        <Typography color="textSecondary" variant="caption">
          {exchangeRateMessages.convertedTotals}
        </Typography>
      ) : null}
      {missingRateCount ? (
        <Typography color="textSecondary" variant="caption">
          {exchangeRateMessages.missingRecordRates(missingRateCount)}
        </Typography>
      ) : null}
    </Stack>
  );
}
