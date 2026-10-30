"use client";
import { useState } from "react";
import { useResolvedTransactionIncomeLinks } from "organisms/transactions/TransactionForm/TransactionIncomeLinksContext";
import { useTransactionForm } from "organisms/transactions/TransactionForm/useTransactionForm";
import type { TransactionFormInitialValues } from "organisms/transactions/TransactionForm/TransactionForm.types";
import type { ItemsStepOptions } from "organisms/transactions/TransactionStepFlow/TransactionStepFlow.types";
import type {
  TransactionAccountOption,
  TransactionMerchantOption,
} from "types/transactions";

/**
 * 小票（新增的从商家记账与编辑记账，#962）共用的表单：
 * 明细抽屉选完分类后再单独输入金额，退款 / 报销选择器优先使用页面的 TransactionIncomeLinksProvider。
 */
export function useTransactionReceiptForm({
  accounts,
  merchants,
  itemsOptions: baseItemsOptions,
  initialValues,
}: {
  accounts: TransactionAccountOption[];
  merchants: TransactionMerchantOption[];
  itemsOptions: ItemsStepOptions;
  initialValues: TransactionFormInitialValues;
}) {
  const itemsOptions = {
    ...baseItemsOptions,
    ...useResolvedTransactionIncomeLinks(baseItemsOptions),
  };
  // 正在输入金额的明细。
  const [amountItemId, setAmountItemId] = useState<number | null>(null);
  const form = useTransactionForm({
    accountOptions: accounts,
    categoryOptions: itemsOptions.categoryOptions,
    merchantOptions: merchants,
    initialValues,
    deferPickerAmount: true,
    onPickerItemCommit: setAmountItemId,
  });
  return { form, itemsOptions, amountItemId, setAmountItemId };
}
