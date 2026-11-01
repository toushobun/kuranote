import type {
  TransactionEntryMethod,
  TransactionRecordType,
} from "types/transactions";

export type NewTransactionEntrySearchParams = {
  method?: string;
  type?: string;
};

export type NewTransactionEntry = {
  method: TransactionEntryMethod;
  /** 标准记账的初始页签。 */
  standardType: TransactionRecordType;
};

function parseStandardType(type?: string): TransactionRecordType {
  return type === "income" || type === "transfer" ? type : "expense";
}

/**
 * 解析记一笔的 URL 参数（#943）：`?method=` 优先；没有时旧链接 `?type=transfer`
 * 进入账户周转，其余进入从商家记账。
 */
export function resolveNewTransactionEntry(
  params: NewTransactionEntrySearchParams,
): NewTransactionEntry {
  const standardType = parseStandardType(params.type);
  const method: TransactionEntryMethod =
    params.method === "transfer" || params.method === "standard"
      ? params.method
      : params.method !== "merchant" && params.type === "transfer"
        ? "transfer"
        : "merchant";
  return {
    method,
    standardType,
  };
}
