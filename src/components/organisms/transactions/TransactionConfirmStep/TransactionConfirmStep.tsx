"use client";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRef, type ReactNode } from "react";
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
import { formatUnsignedCurrencyAmount } from "utils/transactions";
import { TransactionFormHiddenFields } from "../TransactionFormHiddenFields/TransactionFormHiddenFields";
import { TransactionItemAmountDrawer } from "../TransactionItemAmountDrawer/TransactionItemAmountDrawer";
import { TransactionStepAmountEditor } from "../TransactionStepAmountEditor/TransactionStepAmountEditor";
import { TransactionStepItemPicker } from "../TransactionStepItemPicker/TransactionStepItemPicker";
import { formatStepNetTotal } from "../transactionStepFlowFormat";
import { ReceiptItemsSection } from "./ReceiptItemsSection";
import { receiptIconSize } from "./ReceiptLine";
import { ReceiptPaymentSection } from "./ReceiptPaymentSection";
import type { TransactionConfirmStepProps } from "./TransactionConfirmStep.types";
import { useTransactionConfirmStep } from "./useTransactionConfirmStep";

/**
 * 小票（#943 任务 9，设计图 7 + 8）：抬头、明细、合计、支付（收支账户与付款分配）、备注都在这里编辑。
 */
export function TransactionConfirmStep(props: TransactionConfirmStepProps) {
  const f = props.form;
  // 付款未对上时，点提示条定位到支付区。
  const paymentSectionRef = useRef<HTMLDivElement>(null);
  const w = useTransactionConfirmStep(props, paymentSectionRef);
  const currency = w.currency ?? "";
  const total = formatStepNetTotal(f.expenseTotal, f.incomeTotal, currency);
  const format = (amount: number) =>
    formatUnsignedCurrencyAmount(String(amount), currency);
  const hasIncome = f.itemSummaries.some(
    (item) => item.category?.type === "income",
  );
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
                  onClick={props.onBack}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {f.selectedMerchant?.name ?? m.selectMerchant}
                  </Typography>
                </HeaderButton>
                <HeaderButton
                  label={m.time}
                  value={dateTime}
                  error={!f.transactionAtValue}
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
                  onAmount={props.onAmountItemChange}
                />
              </Box>
              <Stack
                direction="row"
                sx={[sectionSx, { alignItems: "flex-start", py: 1.5 }]}
              >
                <Typography sx={{ flex: 1, fontWeight: 700 }}>
                  {m.total}
                </Typography>
                <Stack sx={{ alignItems: "flex-end" }}>
                  <Typography
                    variant="h5"
                    color="primary"
                    sx={{ fontWeight: 800 }}
                  >
                    {total}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {hasIncome
                      ? m.incomeExpense(
                          format(f.expenseTotal),
                          format(f.incomeTotal),
                        )
                      : m.expenseOnly(format(f.expenseTotal))}
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
                  canAddPayment={w.canAddPayment}
                  onChangeAccount={w.setAccountPickerKey}
                  onAmount={w.setPaymentAmountKey}
                  onRemove={w.removePayment}
                />
              </Box>
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
            </Box>
          </Box>
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
      <TransactionBottomEditorDrawer
        open={!!w.pickerPayment}
        title={m.accounts}
        onClose={() => w.setAccountPickerKey(null)}
      >
        <AccountStep
          accounts={w.pickerAccounts}
          recommendedAccountIds={props.suggestions?.recommendedAccountIds}
          selectedAccount={props.accountOptions.find(
            (account) => account.id === w.pickerPayment?.accountId,
          )}
          hasDetails={f.itemSummaries.length > 0}
          onSelect={w.selectAccount}
          onAddAccount={props.onAddAccount}
        />
      </TransactionBottomEditorDrawer>
      <TransactionItemAmountDrawer
        open={!!amountPayment}
        title={amountAccount?.name ?? m.chooseAccount}
        currency={currency}
        value={amountPayment?.amount ?? ""}
        onChange={(amount) =>
          amountPayment &&
          f.handlePaymentAmountChange(amountPayment.key, amount)
        }
        onConfirm={(amount) => {
          if (!amountPayment) return;
          f.handlePaymentAmountChange(amountPayment.key, amount);
          f.handlePaymentAmountCommit(amountPayment.key);
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
}: {
  label: string;
  value: string;
  children: ReactNode;
  onClick: () => void;
  error?: boolean;
}) {
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

// 锯齿高度为齿宽的一半；上下各一排，用 mask 裁出纸片边缘，不使用图片资源。
const toothWidth = 16;
const tornEdgeMask = [
  `conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / ${toothWidth}px 51% repeat-x`,
  `conic-gradient(from 135deg at top, #0000, #000 1deg 89deg, #0000 90deg) top / ${toothWidth}px 51% repeat-x`,
].join(", ");

// mask 会裁掉 box-shadow，阴影改由外层 drop-shadow 沿纸片轮廓绘制。
const receiptShadowSx = {
  filter: `drop-shadow(${designTokens.shadow.card})`,
};
const receiptPaperSx = {
  bgcolor: "background.paper",
  mask: tornEdgeMask,
  WebkitMask: tornEdgeMask,
  px: 2,
  pt: 3,
  pb: 2.5,
};
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
