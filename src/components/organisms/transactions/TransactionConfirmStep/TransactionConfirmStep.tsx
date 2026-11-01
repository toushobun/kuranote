"use client";
import { useReceiptCreation } from "organisms/transactions/ReceiptCreationProvider/ReceiptCreationProvider";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Fragment, useRef, type ReactNode } from "react";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import { TransactionDateTimePicker } from "molecules/transactions/TransactionDateTimePicker";
import {
  formatDateOnlyLabel,
  formatDateValue,
} from "molecules/transactions/TransactionDateTimePicker/dateTimePickerUtils";
import { TransactionBottomEditorDrawer } from "molecules/transactions/TransactionBottomEditorDrawer/TransactionBottomEditorDrawer";
import { MerchantAvatar } from "organisms/merchants/MerchantAvatar/MerchantAvatar";
import { AccountStep } from "organisms/transactions/AccountStep/AccountStep";
import { designTokens } from "theme/theme";
import { TransactionFormHiddenFields } from "../TransactionFormHiddenFields/TransactionFormHiddenFields";
import { TransactionItemAmountDrawer } from "../TransactionItemAmountDrawer/TransactionItemAmountDrawer";
import { TransactionStepAmountEditor } from "../TransactionStepAmountEditor/TransactionStepAmountEditor";
import { TransactionStepItemPicker } from "../TransactionStepItemPicker/TransactionStepItemPicker";
import { transactionAmountMessages } from "utils/transactionMessages";
import {
  formatStepCurrencyAmount,
  formatStepNetTotal,
  summarizeStepReceiptTotals,
} from "../transactionStepFlowFormat";
import { ReceiptItemsSection } from "./ReceiptItemsSection";
import {
  expenseAmountColor,
  incomeAmountColor,
  receiptIconSize,
} from "./ReceiptLine";
import { ReceiptPaymentSection } from "./ReceiptPaymentSection";
import { receiptPaperSx, receiptShadowSx } from "./receiptPaperStyles";
import type { TransactionConfirmStepProps } from "./TransactionConfirmStep.types";
import { useTransactionConfirmStep } from "./useTransactionConfirmStep";

/**
 * 小票（#943 任务 9，设计图 7 + 8）：抬头、明细、合计、支付（收支账户与付款分配）、备注都在这里编辑。
 * `readOnly`（#962）时只显示内容：没有铅笔、×、可点金额、提示条与保存按钮。
 */
export function TransactionConfirmStep(props: TransactionConfirmStepProps) {
  const creation = useReceiptCreation();
  const f = props.form;
  const readOnly = !!props.readOnly;
  // 付款未对上时，点提示条定位到支付区。
  const paymentSectionRef = useRef<HTMLDivElement>(null);
  const w = useTransactionConfirmStep(props, paymentSectionRef);
  const currency = w.currency ?? "";
  const totals = summarizeStepReceiptTotals(f.itemSummaries);
  // 单账户的支付金额是这笔记录实际收付的金额，不扣除其他记录的核销。
  const total = formatStepNetTotal(
    totals.expenseTotal,
    totals.incomeTotal,
    currency,
  );
  const netTotal = formatStepNetTotal(
    totals.businessExpenseTotal,
    totals.businessIncomeTotal,
    currency,
  );
  const format = (amount: number) =>
    formatStepCurrencyAmount(String(amount), currency);
  // 合计下方的小字：支出 · 收入 · 已退款 · 已报销。
  const breakdown = [
    {
      label: m.totalBreakdown.expense,
      amount: totals.expenseTotal,
      color: expenseAmountColor,
    },
    {
      label: m.totalBreakdown.income,
      amount: totals.incomeTotal,
      color: incomeAmountColor,
    },
    {
      label: m.totalBreakdown.refunded,
      amount: totals.refundedTotal,
    },
    {
      label: m.totalBreakdown.reimbursed,
      amount: totals.reimbursedTotal,
    },
    // 金额为 0 的项不显示。
  ].filter((part) => part.amount > 0);
  const dateTime = `${formatDateOnlyLabel(
    f.transactionDate,
    formatDateValue(new Date()),
  )} ${f.transactionTime.slice(0, 5)}`;
  const amountPayment = f.payments.find(
    (payment) => payment.key === w.paymentAmountKey,
  );
  const amountAccount = props.accountOptions.find(
    (account) => account.id === amountPayment?.accountId,
  );
  return (
    <>
      <Box
        component="form"
        id={props.formId}
        action={props.action}
        onSubmit={f.handleSubmit}
      >
        <TransactionFormHiddenFields
          form={f}
          initialValues={props.initialValues}
          includeVisibleFields
        />
        <Stack spacing={2}>
          {props.errorMessage && (
            <Alert severity="error">{props.errorMessage}</Alert>
          )}
          {props.successMessage && (
            <Alert severity="success">{props.successMessage}</Alert>
          )}
          {(readOnly ? [] : w.issues).map((issue) => (
            <Alert key={issue.message} severity="error">
              <ButtonBase onClick={issue.onClick} sx={{ textAlign: "left" }}>
                {issue.message}
              </ButtonBase>
            </Alert>
          ))}
          <Box sx={receiptShadowSx}>
            <Box sx={receiptPaperSx}>
              <Stack spacing={0.5} sx={{ alignItems: "center", pb: 1.5 }}>
                {f.selectedMerchant && (
                  <MerchantAvatar
                    size={48}
                    toneKey={f.selectedMerchant.id}
                    src={f.selectedMerchant.icon_url ?? undefined}
                  />
                )}
                <HeaderButton
                  label={m.merchant}
                  value={f.selectedMerchant?.name ?? m.selectMerchant}
                  error={!f.selectedMerchant}
                  readOnly={readOnly}
                  onClick={props.onMerchantClick}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {f.selectedMerchant?.name ?? m.selectMerchant}
                  </Typography>
                </HeaderButton>
                <HeaderButton
                  label={m.time}
                  value={dateTime}
                  error={!f.transactionAtValue}
                  readOnly={readOnly}
                  onClick={() => w.setEditor("time")}
                >
                  <Typography variant="body2" sx={mutedTextSx}>
                    {dateTime}
                  </Typography>
                </HeaderButton>
              </Stack>
              <Box sx={sectionSx}>
                <ReceiptItemsSection
                  form={f}
                  automaticItemIds={w.automaticItemIds}
                  invalidItems={w.invalidItems}
                  merchantHasHistory={props.merchantHasHistory}
                  canAddItem={props.categoryOptions.length > 0}
                  readOnly={readOnly}
                  onAmount={props.onAmountItemChange}
                />
              </Box>
              <Stack
                direction="row"
                sx={[sectionSx, { alignItems: "center", py: 1.5 }]}
              >
                <Typography
                  sx={{ flex: 1, fontWeight: 700, pr: 1, whiteSpace: "nowrap" }}
                >
                  {totals.hasBusinessOffset
                    ? transactionAmountMessages.netAmount
                    : m.total}
                </Typography>
                <Stack sx={{ alignItems: "flex-end", minWidth: 0 }}>
                  <Typography
                    variant="h5"
                    color="primary"
                    sx={{ fontWeight: 800 }}
                  >
                    {netTotal}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ textAlign: "right" }}
                  >
                    {breakdown.map((part, index) => (
                      <Fragment key={part.label}>
                        {index > 0 && " · "}
                        {/* 每一项不在中间换行 */}
                        <Box component="span" sx={{ whiteSpace: "nowrap" }}>
                          <Box component="span" sx={{ color: part.color }}>
                            {part.label}
                          </Box>{" "}
                          {format(part.amount)}
                        </Box>
                      </Fragment>
                    ))}
                  </Typography>
                </Stack>
              </Stack>
              <Box ref={paymentSectionRef} tabIndex={-1} sx={sectionSx}>
                <Typography variant="caption" sx={sectionTitleSx}>
                  {m.payment}
                </Typography>
                <ReceiptPaymentSection
                  form={f}
                  accountOptions={props.accountOptions}
                  total={total}
                  canAddPayment={!readOnly && w.canAddPayment}
                  readOnly={readOnly}
                  onChangeAccount={w.setAccountPickerKey}
                  onAmount={w.setPaymentAmountKey}
                  onRemove={w.removePayment}
                />
              </Box>
              {readOnly ? (
                f.note && (
                  <Box sx={sectionSx}>
                    <Typography variant="caption" sx={sectionTitleSx}>
                      {m.note}
                    </Typography>
                    <Typography variant="body2" sx={readOnlyNoteSx}>
                      {f.note}
                    </Typography>
                  </Box>
                )
              ) : (
                <Box sx={sectionSx}>
                  <Typography variant="caption" sx={sectionTitleSx}>
                    {m.note}
                  </Typography>
                  <ButtonBase
                    aria-label={m.editReceiptRow(m.note, f.note || m.addNote)}
                    onClick={() => w.setEditor("note")}
                    sx={noteRowSx}
                  >
                    <Typography
                      variant="body2"
                      sx={[
                        {
                          flex: 1,
                          overflowWrap: "anywhere",
                          whiteSpace: "pre-wrap",
                        },
                        !f.note && { color: "text.disabled" },
                      ]}
                    >
                      {f.note || m.addNote}
                    </Typography>
                    <EditOutlinedIcon aria-hidden sx={pencilSx} />
                  </ButtonBase>
                </Box>
              )}
            </Box>
          </Box>
          {!readOnly && (
            <Button
              variant="contained"
              size="large"
              fullWidth
              type="submit"
              loading={props.saving}
              disabled={
                w.issues.length > 0 || f.isSubmitDisabled || props.saving
              }
            >
              {props.saving ? m.saving : (props.submitLabel ?? m.save)}
            </Button>
          )}
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
      <TransactionBottomEditorDrawer
        open={!!w.pickerPayment}
        suspended={!!creation?.editor}
        title={m.accounts}
        onClose={() => w.setAccountPickerKey(null)}
      >
        <AccountStep
          accounts={w.pickerAccounts}
          recommendedAccountIds={props.suggestions?.recommendedAccountIds}
          selectedAccount={w.pickerSelectedAccount}
          hasDetails={f.itemSummaries.length > 0}
          onSelect={w.selectAccount}
          onAddAccount={creation?.addAccount}
        />
      </TransactionBottomEditorDrawer>
      <TransactionItemAmountDrawer
        open={!!amountPayment}
        title={amountAccount?.name ?? m.chooseAccount}
        currency={currency}
        value={amountPayment?.amount ?? ""}
        onConfirm={(amount) => {
          if (!amountPayment) return;
          // 只写入这一行，不把差额补到下一个账户（标准记账仍按 #834 联动）。
          f.handlePaymentAmountChange(amountPayment.key, amount);
          w.setPaymentAmountKey(null);
        }}
        onClose={() => w.setPaymentAmountKey(null)}
      />
      <TransactionStepItemPicker {...props} />
      <TransactionStepAmountEditor {...props} />
    </>
  );
}

/** 抬头中可点击的一行（商家名、日期时间）：铅笔紧跟在文字右侧（设计图 8）。 */
function HeaderButton({
  label,
  value,
  children,
  onClick,
  error = false,
  readOnly = false,
}: {
  label: string;
  value: string;
  children: ReactNode;
  onClick: () => void;
  error?: boolean;
  readOnly?: boolean;
}) {
  if (readOnly) return <Box sx={headerButtonSx}>{children}</Box>;
  return (
    <ButtonBase
      aria-label={m.editReceiptRow(label, value)}
      onClick={onClick}
      data-invalid={error || undefined}
      sx={[
        headerButtonSx,
        error && { color: "error.main", "& .MuiTypography-root": errorTextSx },
      ]}
    >
      {children}
      <EditOutlinedIcon aria-hidden sx={pencilSx} />
    </ButtonBase>
  );
}

const headerButtonSx = {
  display: "inline-flex",
  alignItems: "center",
  gap: 0.5,
  maxWidth: "100%",
  minHeight: 32,
  px: 0.5,
  borderRadius: `${designTokens.radius.sm}px`,
  color: "text.primary",
  "& .MuiTypography-root": {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};
const noteRowSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  width: "100%",
  minHeight: 40,
  borderRadius: `${designTokens.radius.sm}px`,
  color: "text.primary",
  textAlign: "left",
};
const readOnlyNoteSx = {
  minHeight: 40,
  py: 1,
  overflowWrap: "anywhere",
  whiteSpace: "pre-wrap",
};
const errorTextSx = { color: "error.main" };
const pencilSx = {
  color: "text.disabled",
  flexShrink: 0,
  fontSize: receiptIconSize,
};
const sectionSx = {
  borderTop: "1px dashed",
  borderColor: "divider",
  py: 1,
  outline: "none",
};
const sectionTitleSx = {
  color: "text.secondary",
  display: "block",
  fontWeight: 700,
  pt: 0.5,
};
const mutedTextSx = { color: "text.secondary" };
