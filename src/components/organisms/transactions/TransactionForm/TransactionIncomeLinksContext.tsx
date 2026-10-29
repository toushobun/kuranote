"use client";

import { createContext, useContext, type ReactNode } from "react";

import type {
  TransactionGroupPage,
  TransactionMonthPage,
  TransactionSearchPage,
  TransactionTimeGroupViewData,
} from "types/transactions";

export type TransactionIncomeLinksContextValue = {
  loadRefundGroupItemsAction?: (
    groupKey: string,
    offset: number,
  ) => Promise<TransactionMonthPage>;
  loadRefundMoreGroupsAction?: (
    offset: number,
  ) => Promise<TransactionGroupPage>;
  loadRefundSearchPageAction?: (
    query: string,
    offset: number,
  ) => Promise<TransactionSearchPage>;
  loadReimbursementGroupItemsAction?: (
    groupKey: string,
    offset: number,
  ) => Promise<TransactionMonthPage>;
  loadReimbursementMoreGroupsAction?: (
    offset: number,
  ) => Promise<TransactionGroupPage>;
  loadReimbursementSearchPageAction?: (
    query: string,
    offset: number,
  ) => Promise<TransactionSearchPage>;
  refundPickerView?: TransactionTimeGroupViewData;
  reimbursementPickerView?: TransactionTimeGroupViewData;
};

const TransactionIncomeLinksContext =
  createContext<TransactionIncomeLinksContextValue | null>(null);

export function TransactionIncomeLinksProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: TransactionIncomeLinksContextValue;
}) {
  return (
    <TransactionIncomeLinksContext.Provider value={value}>
      {children}
    </TransactionIncomeLinksContext.Provider>
  );
}

/** 退款 / 报销选择器数据：有 Provider 时优先使用 Provider，否则回退到调用方传入的值。 */
export function useResolvedTransactionIncomeLinks(
  fallback: TransactionIncomeLinksContextValue,
): TransactionIncomeLinksContextValue {
  const context = useContext(TransactionIncomeLinksContext);
  return {
    loadRefundGroupItemsAction:
      context?.loadRefundGroupItemsAction ??
      fallback.loadRefundGroupItemsAction,
    loadRefundMoreGroupsAction:
      context?.loadRefundMoreGroupsAction ??
      fallback.loadRefundMoreGroupsAction,
    loadRefundSearchPageAction:
      context?.loadRefundSearchPageAction ??
      fallback.loadRefundSearchPageAction,
    loadReimbursementGroupItemsAction:
      context?.loadReimbursementGroupItemsAction ??
      fallback.loadReimbursementGroupItemsAction,
    loadReimbursementMoreGroupsAction:
      context?.loadReimbursementMoreGroupsAction ??
      fallback.loadReimbursementMoreGroupsAction,
    loadReimbursementSearchPageAction:
      context?.loadReimbursementSearchPageAction ??
      fallback.loadReimbursementSearchPageAction,
    refundPickerView: context?.refundPickerView ?? fallback.refundPickerView,
    reimbursementPickerView:
      context?.reimbursementPickerView ?? fallback.reimbursementPickerView,
  };
}
