"use client";

import { createContext, useContext, type ReactNode } from "react";

import type {
  TransactionGroupPage,
  TransactionMonthPage,
  TransactionReimbursementCandidate,
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
  reimbursementCandidates: TransactionReimbursementCandidate[];
  refundPickerView?: TransactionTimeGroupViewData;
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

export function useTransactionIncomeLinks() {
  return useContext(TransactionIncomeLinksContext);
}
