"use client";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import type { ReactNode } from "react";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import { TransactionDateTimePicker } from "molecules/transactions/TransactionDateTimePicker";
import {
  formatDateOnlyLabel,
  formatDateValue,
} from "molecules/transactions/TransactionDateTimePicker/dateTimePickerUtils";
import { TransactionBottomEditorDrawer } from "molecules/transactions/TransactionBottomEditorDrawer/TransactionBottomEditorDrawer";
import { TransactionFormHiddenFields } from "../TransactionFormHiddenFields/TransactionFormHiddenFields";
import { TransactionStepAmountEditor } from "../TransactionStepAmountEditor/TransactionStepAmountEditor";
import {
  formatCategoryName,
  formatSignedCurrencyAmount,
} from "../TransactionForm/TransactionForm.utils";
import { formatTransactionRowAmount } from "utils/transactions";
import type { TransactionItemsStepProps } from "../TransactionItemsStep/TransactionItemsStep.types";
import { useTransactionConfirmStep } from "./useTransactionConfirmStep";

export type TransactionConfirmStepProps = TransactionItemsStepProps & {
  action: (data: FormData) => void;
  errorMessage?: string;
  successMessage?: string;
  saving: boolean;
  goToStep: (step: number) => void;
};
export function TransactionConfirmStep(props: TransactionConfirmStepProps) {
  const f = props.form;
  const w = useTransactionConfirmStep(
    f,
    props.goToStep,
    props.onAmountItemChange,
  );
  return (
    <>
      <Box component="form" action={props.action} onSubmit={f.handleSubmit}>
        <TransactionFormHiddenFields form={f} includeVisibleFields />
        <Stack spacing={2}>
          {props.errorMessage && (
            <Alert severity="error">{props.errorMessage}</Alert>
          )}
          {props.successMessage && (
            <Alert severity="success">{props.successMessage}</Alert>
          )}
          {w.issues.map((issue) => (
            <Alert key={issue.message} severity="error">
              <ButtonBase onClick={issue.onClick} sx={{ textAlign: "left" }}>
                {issue.message}
              </ButtonBase>
            </Alert>
          ))}
          <Paper variant="outlined" sx={{ overflow: "hidden" }}>
            <ConfirmRow
              label={m.merchant}
              error={!f.selectedMerchant}
              onClick={() => props.goToStep(1)}
            >
              {f.selectedMerchant?.name ?? m.selectMerchant}
            </ConfirmRow>
            <ConfirmRow
              label={m.accounts}
              error={w.accountError}
              onClick={() => props.goToStep(f.isMultiAccount ? 3 : 2)}
            >
              {f.selectedAccount
                ? f.isMultiAccount
                  ? m.multipleAccounts(
                      f.selectedAccount.name,
                      f.payments.length,
                    )
                  : `${f.selectedAccount.name} ${f.selectedAccount.currency}`
                : m.selectAccount}
            </ConfirmRow>
            {!f.itemSummaries.length && (
              <ConfirmRow
                label={m.itemsTitle}
                error
                onClick={() => props.goToStep(3)}
              >
                {m.missingItems}
              </ConfirmRow>
            )}
            {f.itemSummaries.map((item, index) => (
              <ConfirmRow
                key={item.id}
                label={`${m.itemsTitle} ${index + 1}`}
                error={w.invalidItems.includes(item)}
                onClick={() =>
                  !item.amount.trim() && f.selectedAccount
                    ? props.onAmountItemChange(item.id)
                    : props.goToStep(3)
                }
              >
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ justifyContent: "space-between", flex: 1 }}
                >
                  <span>
                    {item.category
                      ? formatCategoryName(item.category)
                      : m.missingCategory}
                  </span>
                  <span>
                    {item.amount.trim()
                      ? formatTransactionRowAmount(
                          item.category?.type ?? f.selectedType,
                          item.amount,
                          f.selectedAccount?.currency,
                        )
                      : m.pendingAmount}
                  </span>
                </Stack>
              </ConfirmRow>
            ))}
            <ConfirmRow
              label={m.note}
              muted={!f.note}
              onClick={() => w.setEditor("note")}
            >
              {f.note || m.addNote}
            </ConfirmRow>
            <ConfirmRow
              label={m.time}
              error={!f.transactionAtValue}
              onClick={() => w.setEditor("time")}
            >
              {formatDateOnlyLabel(
                f.transactionDate,
                formatDateValue(new Date()),
              )}{" "}
              {f.transactionTime.slice(0, 5)}
            </ConfirmRow>
            <Stack
              direction="row"
              sx={{ p: 2, justifyContent: "space-between" }}
            >
              <Typography sx={{ fontWeight: "bold" }}>{m.total}</Typography>
              <Typography color="primary" variant="h6">
                {formatSignedCurrencyAmount(
                  f.signedTotalAmount,
                  f.selectedAccount?.currency,
                )}
              </Typography>
            </Stack>
          </Paper>
          <Button
            variant="contained"
            size="large"
            fullWidth
            type="submit"
            loading={props.saving}
            disabled={w.issues.length > 0 || f.isSubmitDisabled || props.saving}
          >
            {props.saving ? m.saving : m.save}
          </Button>
        </Stack>
      </Box>
      <TransactionBottomEditorDrawer
        open={w.editor === "note"}
        title={m.note}
        onClose={() => w.setEditor(null)}
      >
        <TextField
          label={m.note}
          multiline
          minRows={4}
          fullWidth
          value={f.note}
          onChange={f.handleNoteChange}
          helperText={m.noteCount(f.note.length)}
          slotProps={{ htmlInput: { maxLength: m.noteLimit } }}
        />
      </TransactionBottomEditorDrawer>
      {w.editor === "time" && (
        <TransactionDateTimePicker
          date={f.transactionDate}
          time={f.transactionTime}
          onDateChange={f.handleDateChange}
          onTimeChange={f.handleTimeChange}
          editor={{
            open: true,
            onClose: () => w.setEditor(null),
            title: m.time,
          }}
        />
      )}
      <TransactionStepAmountEditor {...props} />
    </>
  );
}
function ConfirmRow({
  label,
  children,
  onClick,
  error = false,
  muted = false,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  error?: boolean;
  muted?: boolean;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      data-invalid={error || undefined}
      sx={{
        display: "flex",
        width: "100%",
        gap: 1.5,
        p: 2,
        minHeight: 56,
        textAlign: "left",
        borderBottom: 1,
        borderColor: "divider",
        color: error ? "error.main" : "text.primary",
        bgcolor: error ? "action.hover" : undefined,
      }}
    >
      <Typography variant="body2" sx={{ flexShrink: 0, minWidth: 64 }}>
        {label}
      </Typography>
      <Box
        sx={{
          flex: 1,
          overflowWrap: "anywhere",
          color: muted ? "text.secondary" : "inherit",
        }}
      >
        {children}
      </Box>
      <ChevronRightRoundedIcon fontSize="small" />
    </ButtonBase>
  );
}
