import { isUuid } from "utils/formData";
import type { TransactionEntryMethod } from "types/transactions";

export type NewTransactionEntrySearchParams = {
  method?: string;
  type?: string;
  refundFrom?: string | string[];
  reimbursementFrom?: string | string[];
};

/**
 * 解析记一笔的 URL 参数（#943）：`?method=` 优先；没有时旧链接 `?type=transfer`
 * 进入账户周转，其余进入从商家记账。已停用的标准记账（`?method=standard`，#1048）
 * 不论带不带 `type`，都进入从商家记账。
 */
export function resolveNewTransactionEntry(
  params: NewTransactionEntrySearchParams,
): TransactionEntryMethod {
  if (params.method === "transfer") return "transfer";
  if (params.method === "merchant" || params.method === "standard") {
    return "merchant";
  }
  if (params.type === "transfer") {
    return "transfer";
  }
  return "merchant";
}

/** 冲突、数组或非法标识都按普通新增处理。 */
export function resolveOffsetEntry(params: NewTransactionEntrySearchParams) {
  if (params.refundFrom !== undefined && params.reimbursementFrom !== undefined)
    return null;
  const recordId = params.refundFrom ?? params.reimbursementFrom;
  if (typeof recordId !== "string" || !isUuid(recordId)) return null;
  return {
    recordId,
    kind: params.refundFrom ? ("refund" as const) : ("reimbursement" as const),
  };
}
