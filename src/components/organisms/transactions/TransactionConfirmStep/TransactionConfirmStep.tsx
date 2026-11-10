"use client";
import { useReceiptCreation } from "organisms/transactions/ReceiptCreationProvider/ReceiptCreationProvider";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Fragment, useRef, type FormEvent } from "react";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import { TransactionBottomEditorDrawer } from "molecules/transactions/TransactionBottomEditorDrawer/TransactionBottomEditorDrawer";
import { MerchantAvatar } from "organisms/merchants/MerchantAvatar/MerchantAvatar";
import { AccountStep } from "organisms/transactions/AccountStep/AccountStep";
import { ReceiptAmountRow } from "organisms/transactions/ReceiptParts/ReceiptAmountRow";
import { ReceiptHeaderButton } from "organisms/transactions/ReceiptParts/ReceiptHeaderButton";
import { ReceiptIssueAlerts } from "organisms/transactions/ReceiptParts/ReceiptIssueAlerts";
import { ReceiptNoteSection } from "organisms/transactions/ReceiptParts/ReceiptNoteSection";
import { ReceiptPaper } from "organisms/transactions/ReceiptParts/ReceiptPaper";
import { ReceiptSubmitButton } from "organisms/transactions/ReceiptParts/ReceiptSubmitButton";
import { ReceiptTimeButton } from "organisms/transactions/ReceiptParts/ReceiptTimeButton";
import {
  receiptSectionSx as sectionSx,
  receiptSectionTitleSx as sectionTitleSx,
} from "organisms/transactions/ReceiptParts/receiptStyles";
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
import { expenseAmountColor, incomeAmountColor } from "./ReceiptLine";
import { ReceiptPaymentSection } from "./ReceiptPaymentSection";
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
  // 只显示上次点保存时已有、现在仍未解决的提示（#1016 / #1040）。
  const visibleIssues = w.issues.filter((issue) => w.isChecked(issue.id));
  const hasVisibleIssue = (id: string) =>
    visibleIssues.some((issue) => issue.id === id);
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const hasIssues = w.checkIssues();
    if (!readOnly && hasIssues) {
      event.preventDefault();
      props.onValidationFailed?.();
      return;
    }
    f.handleSubmit(event);
    if (event.defaultPrevented) props.onValidationFailed?.();
  }
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
        onSubmit={handleSubmit}
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
          <ReceiptIssueAlerts
            issues={visibleIssues}
            pulseCount={w.pulseCount}
            firstIssueRef={w.firstIssueRef}
          />
          <ReceiptPaper>
            <Stack spacing={0.5} sx={{ alignItems: "center", pb: 1.5 }}>
              {f.selectedMerchant && (
                <MerchantAvatar
                  size={48}
                  toneKey={f.selectedMerchant.id}
                  src={f.selectedMerchant.icon_url ?? undefined}
                />
              )}
              <ReceiptHeaderButton
                label={m.merchant}
                value={f.selectedMerchant?.name ?? m.selectMerchant}
                error={hasVisibleIssue("merchant")}
                readOnly={readOnly}
                onClick={props.onMerchantClick}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {f.selectedMerchant?.name ?? m.selectMerchant}
                </Typography>
              </ReceiptHeaderButton>
              <ReceiptTimeButton
                date={f.transactionDate}
                time={f.transactionTime}
                onDateChange={f.handleDateChange}
                onTimeChange={f.handleTimeChange}
                open={w.editor === "time"}
                onOpenChange={(open) => w.setEditor(open ? "time" : null)}
                error={hasVisibleIssue("time")}
                readOnly={readOnly}
              />
            </Stack>
            <Box sx={sectionSx}>
              <ReceiptItemsSection
                form={f}
                showAutomaticNotice={props.showAutomaticNotice}
                invalidItems={w.markedItems}
                canAddItem={props.categoryOptions.length > 0}
                readOnly={readOnly}
                onAmount={props.onAmountItemChange}
              />
            </Box>
            <ReceiptAmountRow
              label={
                totals.hasBusinessOffset
                  ? transactionAmountMessages.netAmount
                  : m.total
              }
              amount={netTotal}
              caption={breakdown.map((part, index) => (
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
            />
            <Box ref={paymentSectionRef} tabIndex={-1} sx={sectionSx}>
              <Typography variant="caption" sx={sectionTitleSx}>
                {m.payment(f.isIncomePayment)}
              </Typography>
              <ReceiptPaymentSection
                form={f}
                accountOptions={props.accountOptions}
                total={total}
                canAddPayment={!readOnly && w.canAddPayment}
                showMixedPaymentHint={!readOnly && w.showMixedPaymentHint}
                readOnly={readOnly}
                invalidPaymentKeys={w.markedPaymentKeys}
                reconciliationInvalid={hasVisibleIssue("account")}
                onAddPayment={w.openAddPayment}
                onChangeAccount={w.setAccountPickerKey}
                onAmount={w.setPaymentAmountKey}
                onRemove={w.removePayment}
              />
            </Box>
            <ReceiptNoteSection
              note={f.note}
              onChange={f.handleNoteChange}
              readOnly={readOnly}
            />
          </ReceiptPaper>
          {!readOnly && (
            <ReceiptSubmitButton
              edit={!!props.initialValues}
              label={props.submitLabel ?? m.save}
              saving={props.saving}
            />
          )}
        </Stack>
      </Box>
      <TransactionBottomEditorDrawer
        open={w.accountPickerKey !== null}
        suspended={!!creation?.editor}
        title={m.accounts}
        onClose={() => w.setAccountPickerKey(null)}
      >
        <AccountStep
          accounts={w.pickerAccounts}
          recommendedAccountIds={props.suggestions?.recommendedAccountIds}
          selectedAccount={w.pickerSelectedAccount}
          previousCurrency={w.previousCurrency}
          hasDetails={f.itemSummaries.length > 0}
          onSelect={w.selectAccount}
          onAddAccount={
            creation?.addAccount
              ? (onCreated) => creation.addAccount?.(onCreated)
              : undefined
          }
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
