"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { TransactionConsumerOption } from "types/transactions";

export type TransactionConsumerContextValue = {
  consumerOptions: TransactionConsumerOption[];
  initialConsumerUserIds?: string[];
  recorderUserId: string;
};

const TransactionConsumerContext =
  createContext<TransactionConsumerContextValue | null>(null);

export function TransactionConsumerProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: TransactionConsumerContextValue;
}) {
  return (
    <TransactionConsumerContext.Provider value={value}>
      {children}
    </TransactionConsumerContext.Provider>
  );
}

export function useTransactionConsumers() {
  return useContext(TransactionConsumerContext);
}
