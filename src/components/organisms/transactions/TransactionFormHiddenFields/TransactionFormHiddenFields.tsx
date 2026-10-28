import { Fragment } from "react";
import {
  getLinkedEditExpectedUpdatedAtFieldName,
  linkedEditExpectedRecordUpdatedAtFieldName,
} from "internal/transaction/adapter/next/linkedEditInput";
import type {
  TransactionFormItem,
  TransactionFormInitialValues,
} from "../TransactionForm/TransactionForm.types";
import type { useTransactionForm } from "../TransactionForm/useTransactionForm";

export function getTransactionPaymentInputNames(paymentCount: number) {
  return {
    account: paymentCount > 1 ? "paymentAccountId" : "accountId",
    amount: paymentCount > 1 ? "paymentAmount" : undefined,
  };
}

export function TransactionItemHiddenFields({
  item,
}: {
  item: TransactionFormItem;
}) {
  return (
    <>
      <input name="itemCategoryId" type="hidden" value={item.categoryId} />
      <input
        name="itemPersistedId"
        type="hidden"
        value={item.persistedId ?? ""}
      />
      {item.persistedId && item.expectedUpdatedAt ? (
        <input
          name={getLinkedEditExpectedUpdatedAtFieldName(item.persistedId)}
          type="hidden"
          value={item.expectedUpdatedAt}
        />
      ) : null}
      <input
        name="itemSpecialStatus"
        type="hidden"
        value={item.specialStatus ?? ""}
      />
      <input
        name="itemRefundedItemId"
        type="hidden"
        value={item.refundCandidate?.id ?? ""}
      />
      <input
        name="itemReimbursementItemId"
        type="hidden"
        value={item.reimbursementCandidate?.id ?? ""}
      />
    </>
  );
}

export function TransactionFormHiddenFields({
  form,
  initialValues,
  includeVisibleFields = false,
}: {
  form: ReturnType<typeof useTransactionForm>;
  initialValues?: TransactionFormInitialValues;
  includeVisibleFields?: boolean;
}) {
  const paymentNames = getTransactionPaymentInputNames(form.payments.length);
  return (
    <>
      <input
        name="timeZoneOffsetMinutes"
        type="hidden"
        value={form.timeZoneOffsetMinutes}
      />
      <input
        name="transactionAt"
        type="hidden"
        value={form.transactionAtValue}
      />
      <input name="type" type="hidden" value={form.selectedType} />
      {initialValues?.transactionRecordId && (
        <input
          name="transactionRecordId"
          type="hidden"
          value={initialValues.transactionRecordId}
        />
      )}
      {initialValues?.expectedRecordUpdatedAt && (
        <input
          name={linkedEditExpectedRecordUpdatedAtFieldName}
          type="hidden"
          value={initialValues.expectedRecordUpdatedAt}
        />
      )}
      {includeVisibleFields && (
        <>
          <input
            name="merchantId"
            type="hidden"
            value={form.selectedMerchantId}
          />
          <input name="note" type="hidden" value={form.note} />
          {form.payments.map((payment) => (
            <Fragment key={payment.key}>
              <input
                name={paymentNames.account}
                type="hidden"
                value={payment.accountId}
              />
              {paymentNames.amount && (
                <input
                  name={paymentNames.amount}
                  type="hidden"
                  value={payment.amount}
                />
              )}
            </Fragment>
          ))}
          {form.itemSummaries.map((item) => (
            <Fragment key={item.id}>
              <TransactionItemHiddenFields item={item} />
              <input name="itemAmount" type="hidden" value={item.amount} />
            </Fragment>
          ))}
        </>
      )}
    </>
  );
}
