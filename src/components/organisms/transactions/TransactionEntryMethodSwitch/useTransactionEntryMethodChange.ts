"use client";
import { useRouter } from "next/navigation";
import { transactionsNewEntryHref } from "config/paths";
import type { TransactionEntryMethod } from "types/transactions";

/** 切换记账方式：替换当前历史记录，返回键直接离开记一笔。 */
export function useTransactionEntryMethodChange() {
  const router = useRouter();
  return (method: TransactionEntryMethod) =>
    router.replace(transactionsNewEntryHref({ method }));
}
