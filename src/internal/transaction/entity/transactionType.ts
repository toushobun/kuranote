export const transactionTypes = ["expense", "income"] as const;

export type TransactionType = (typeof transactionTypes)[number];

export const transactionRecordStorageTypes = ["normal", "transfer"] as const;

export type TransactionRecordStorageType =
  (typeof transactionRecordStorageTypes)[number];
