"use client";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { AccountTypeIcon } from "atoms/accounts/AccountTypeIcon/AccountTypeIcon";
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
 * 小票的支付区：每个付款账户一行（账户类型图标、账户名、币种、金额、铅笔、×），
 * 多账户时最后一行对账，下面是「＋ 添加付款账户」。校验与金额联动沿用 `useTransactionForm`。
 */
export function ReceiptPaymentSection({
  form,
  accountOptions,
  total,
  canAddPayment,
  readOnly = false,
  onChangeAccount,
  onAmount,
  onRemove,
}: {
  form: ReturnType<typeof useTransactionForm>;
  accountOptions: readonly TransactionAccountOption[];
  /** 单账户时的支付金额（由明细推导的合计）。 */
  total: string;
  canAddPayment: boolean;
  readOnly?: boolean;
  onChangeAccount: (key: number) => void;
  onAmount: (key: number) => void;
  onRemove: (key: number) => void;
}) {
  const currency = form.selectedAccount?.currency ?? "";
  const reconciliation = form.paymentReconciliation;
  // 多账户时每一行都可删除（含刚添加、尚未选账户的行）；单账户未选账户时没有可删除的内容。
  const removable = (account: TransactionAccountOption | undefined) =>
    form.isMultiAccount || !!account;
  const format = (amount: string) =>
    formatUnsignedCurrencyAmount(amount, currency);
  return (
    <>
      {form.payments.map((payment, index) => {
        const account = accountOptions.find(
          (option) => option.id === payment.accountId,
        );
        const amount = payment.amount.trim()
          ? format(payment.amount)
          : m.pendingAmount;
        return (
          <ReceiptLine
            key={payment.key}
            icon={
              account ? (
                <AccountTypeIcon type={account.type ?? "other"} />
              ) : (
                <AccountBalanceWalletRoundedIcon fontSize="small" />
              )
            }
            label={
              account?.name ?? (readOnly ? m.archivedAccount : m.chooseAccount)
            }
            error={!account && !readOnly}
            labelClickable={!readOnly && !account}
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
                  label={m.editPaymentAmount(index + 1, amount)}
                  amount={amount}
                  pending={!payment.amount.trim()}
                  onClick={() => onAmount(payment.key)}
                />
              ) : (
                <ReceiptAmountText amount={total} />
              )
            }
            {...(!readOnly && {
              editLabel: m.changePaymentAccount(index + 1),
              onEdit: () => onChangeAccount(payment.key),
              removeLabel: removable(account)
                ? m.removePayment(index + 1)
                : undefined,
              onRemove: removable(account)
                ? () => onRemove(payment.key)
                : undefined,
            })}
          />
        );
      })}
      {form.isMultiAccount && (
        <Typography
          variant="caption"
          role="status"
          aria-live="polite"
          data-invalid={!reconciliation.isBalanced || undefined}
          sx={[
            reconciliationSx,
            reconciliation.isBalanced
              ? { color: "success.main" }
              : { color: "error.main" },
          ]}
        >
          {m.paymentReconciliation(
            format(reconciliation.paymentTotal),
            format(reconciliation.itemTotal),
            reconciliation.isBalanced,
          )}
          {!reconciliation.isBalanced &&
            ` · ${transactionPaymentFieldsMessages.difference(format(reconciliation.difference))}`}
        </Typography>
      )}
      {canAddPayment && (
        <Button
          fullWidth
          startIcon={<AddRoundedIcon />}
          onClick={() => void form.handleAddPayment()}
        >
          {form.isMultiAccount ? m.addPayment : m.addSharedPayment}
        </Button>
      )}
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
