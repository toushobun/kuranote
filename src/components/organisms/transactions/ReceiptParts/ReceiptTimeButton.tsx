"use client";
import Typography from "@mui/material/Typography";

import { flowMessages as m } from "config/transactionStepFlowMessages";
import { TransactionDateTimePicker } from "molecules/transactions/TransactionDateTimePicker";
import {
  formatDateOnlyLabel,
  formatDateValue,
} from "molecules/transactions/TransactionDateTimePicker/dateTimePickerUtils";

import { ReceiptHeaderButton } from "./ReceiptHeaderButton";
import { receiptMutedTextSx } from "./receiptStyles";

/** 小票抬头的日期时间：点一下打开日期时间编辑器。 */
export function ReceiptTimeButton({
  date,
  time,
  onDateChange,
  onTimeChange,
  open,
  onOpenChange,
  error = false,
  readOnly = false,
}: {
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error?: boolean;
  readOnly?: boolean;
}) {
  const dateTime = `${formatDateOnlyLabel(date, formatDateValue(new Date()))} ${time.slice(0, 5)}`;
  return (
    <>
      <ReceiptHeaderButton
        label={m.time}
        value={dateTime}
        error={error}
        readOnly={readOnly}
        onClick={() => onOpenChange(true)}
      >
        <Typography variant="body2" sx={receiptMutedTextSx}>
          {dateTime}
        </Typography>
      </ReceiptHeaderButton>
      {open && (
        <TransactionDateTimePicker
          date={date}
          time={time}
          onDateChange={onDateChange}
          onTimeChange={onTimeChange}
          editor={{
            open: true,
            onClose: () => onOpenChange(false),
            title: m.time,
          }}
        />
      )}
    </>
  );
}
