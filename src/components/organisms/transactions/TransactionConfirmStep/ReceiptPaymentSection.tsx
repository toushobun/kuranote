"use client";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import { ReceiptAddButton } from "./ReceiptAddButton";
import { ReceiptLoadingRow } from "./ReceiptLoadingRow";
import { TransactionMixedPaymentHint } from "atoms/transactions/TransactionMixedPaymentHint";
import Typography from "@mui/material/Typography";
import { AccountAvatar } from "atoms/accounts/AccountAvatar/AccountAvatar";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { TransactionAccountOption } from "types/transactions";
import { transactionPaymentFieldsMessages } from "utils/transactionMessages";
import { formatUnsignedCurrencyAmount } from "utils/transactions";
import type { useTransactionForm } from "../TransactionForm/useTransactionForm";
import {
  ReceiptAmountButton,
  ReceiptAmountText,
  ReceiptLine,
} from "./ReceiptLine";

/**
 * 小票的支付区：每个付款账户一行（账户文字图标、账户名、币种、金额、铅笔、×），
 * 多账户时最后一行对账，下面是「＋ 添加付款账户」。校验与金额联动沿用 `useTransactionForm`。
 */
export function ReceiptPaymentSection({
  form,
  accountOptions,
  total,
  canAddPayment,
  suggestionsLoading = false,
  showMixedPaymentHint,
  readOnly = false,
  invalidPaymentKeys,
  reconciliationInvalid,
  onAddPayment,
  onChangeAccount,
  onAmount,
  onRemove,
}: {
  form: ReturnType<typeof useTransactionForm>;
  accountOptions: readonly TransactionAccountOption[];
  /** 单账户时的支付金额（由明细推导的合计）。 */
  total: string;
  canAddPayment: boolean;
  suggestionsLoading?: boolean;
  showMixedPaymentHint: boolean;
  readOnly?: boolean;
  /** 要标红的付款行（只含上次点保存时已有、仍未解决的问题，#1040）。 */
  invalidPaymentKeys: readonly number[];
  /** 多账户未对上时对账行是否标红（跟随顶部「账户」提示）。 */
  reconciliationInvalid: boolean;
  onAddPayment: () => void;
  onChangeAccount: (key: number) => void;
  onAmount: (key: number) => void;
  onRemove: (key: number) => void;
}) {
  const currency = form.selectedAccount?.currency ?? "";
  const income = form.isIncomePayment;
  const reconciliation = form.paymentReconciliation;
  const reconciliationError =
    reconciliationInvalid && !reconciliation.isBalanced;
  const format = (amount: string) =>
    formatUnsignedCurrencyAmount(amount, currency);
  return (
    <>
      {form.payments.map((payment, index) => {
        if (!readOnly && !payment.accountId) return null;
        const account = accountOptions.find(
          (option) => option.id === payment.accountId,
        );
        const invalid = invalidPaymentKeys.includes(payment.key);
        const amount = payment.amount.trim()
          ? format(payment.amount)
          : m.pendingAmount;
        return (
          <ReceiptLine
            key={payment.key}
            icon={
              account ? (
                <AccountAvatar
                  iconUrl={account.icon_url}
                  id={account.id}
                  name={account.name}
                  size={24}
                />
              ) : (
                <AccountBalanceWalletRoundedIcon fontSize="small" />
              )
            }
            label={account?.name ?? m.archivedAccount}
            error={invalid && !account}
            tags={
              account && (
                <Typography variant="caption" sx={currencySx}>
                  {account.currency}
                </Typography>
              )
            }
            amount={
              readOnly ? (
                <ReceiptAmountText
                  amount={form.isMultiAccount ? amount : total}
                />
              ) : !account ? null : form.isMultiAccount ? (
                <ReceiptAmountButton
                  label={m.editPaymentAmount(index + 1, amount, income)}
                  amount={amount}
                  pending={invalid && !payment.amount.trim()}
                  onClick={() => onAmount(payment.key)}
                />
              ) : (
                <ReceiptAmountText amount={total} />
              )
            }
            {...(!readOnly && {
              editLabel: m.changePaymentAccount(index + 1, income),
              onEdit: () => onChangeAccount(payment.key),
              removeLabel: m.removePayment(index + 1, income),
              onRemove: () => onRemove(payment.key),
            })}
          />
        );
      })}
      {form.isMultiAccount && (
        <Typography
          variant="caption"
          role="status"
          aria-live="polite"
          data-invalid={reconciliationError || undefined}
          sx={[
            reconciliationSx,
            reconciliation.isBalanced
              ? { color: "success.main" }
              : reconciliationError
                ? { color: "error.main" }
                : { color: "text.secondary" },
          ]}
        >
          {transactionPaymentFieldsMessages.reconciliation(
            format(reconciliation.paymentTotal),
            format(reconciliation.itemTotal),
            income,
            reconciliation.isBalanced,
          )}
          {!reconciliation.isBalanced &&
            ` · ${transactionPaymentFieldsMessages.difference(format(reconciliation.difference))}`}
        </Typography>
      )}
      {!readOnly && suggestionsLoading ? (
        <ReceiptLoadingRow label={m.loadingPayments} />
      ) : (
        canAddPayment && (
          <ReceiptAddButton
            label={transactionPaymentFieldsMessages.addPayment(income)}
            onClick={onAddPayment}
          />
        )
      )}
      {showMixedPaymentHint && <TransactionMixedPaymentHint />}
    </>
  );
}

const currencySx = { color: "text.secondary", ml: "auto", flexShrink: 0 };
const reconciliationSx = {
  display: "block",
  fontWeight: 700,
  py: 0.5,
  textAlign: "right",
};
