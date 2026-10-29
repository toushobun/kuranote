import type {
  TransactionEntryMethod,
  TransactionRecordType,
} from "types/transactions";

export type NewTransactionEntrySearchParams = {
  accountId?: string;
  merchantId?: string;
  method?: string;
  type?: string;
};

export type NewTransactionEntry = {
  initialAccountId?: string;
  initialMerchantId?: string;
  /** 从商家记账的初始步骤：带回商家时停在账户，带回商家和账户时停在明细。 */
  initialStep: number;
  method: TransactionEntryMethod;
  /** 标准记账的初始页签。 */
  standardType: TransactionRecordType;
};

function parseStandardType(type?: string): TransactionRecordType {
  return type === "income" || type === "transfer" ? type : "expense";
}

/**
 * 解析记一笔的 URL 参数（#943）：`?method=` 优先；没有时旧链接 `?type=transfer`
 * 进入账户周转，其余进入从商家记账。带回的商家 / 账户只采用当前账本可选的项。
 */
export function resolveNewTransactionEntry(
  params: NewTransactionEntrySearchParams,
  options: {
    accountOptions: readonly { id: string }[];
    merchantOptions: readonly { id: string }[];
  },
): NewTransactionEntry {
  const standardType = parseStandardType(params.type);
  const method: TransactionEntryMethod =
    params.method === "transfer" || params.method === "standard"
      ? params.method
      : params.method !== "merchant" && params.type === "transfer"
        ? "transfer"
        : "merchant";
  const initialMerchantId = options.merchantOptions.some(
    (merchant) => merchant.id === params.merchantId,
  )
    ? params.merchantId
    : undefined;
  const initialAccountId = options.accountOptions.some(
    (account) => account.id === params.accountId,
  )
    ? params.accountId
    : undefined;
  return {
    initialAccountId,
    initialMerchantId,
    initialStep: initialMerchantId ? (initialAccountId ? 3 : 2) : 1,
    method,
    standardType,
  };
}
