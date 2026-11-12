"use client";

import { createContext, useContext, type ReactNode } from "react";

import type {
  TransactionLinkCandidatePage,
  TransactionLinkCandidatePageInput,
} from "types/transactions";

export type TransactionIncomeLinksContextValue = {
  loadRefundPageAction?: (
    input: TransactionLinkCandidatePageInput,
  ) => Promise<TransactionLinkCandidatePage>;
  loadReimbursementPageAction?: (
    input: TransactionLinkCandidatePageInput,
  ) => Promise<TransactionLinkCandidatePage>;
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
    loadRefundPageAction:
      context?.loadRefundPageAction ?? fallback.loadRefundPageAction,
    loadReimbursementPageAction:
      context?.loadReimbursementPageAction ??
      fallback.loadReimbursementPageAction,
  };
}
