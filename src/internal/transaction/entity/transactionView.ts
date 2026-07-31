import type { TransactionFormOptions } from "internal/transaction/entity/transactionFormOptions";
import type { TransferEditInitialValues } from "internal/transaction/entity/transferEditInitialValues";
import type { TransactionType } from "types/transactions";

export type NewTransactionView = TransactionFormOptions & {
  canWriteTransactions: boolean;
  ledgerName: string;
};

export type EditTransactionView = TransactionFormOptions & {
  canEdit: boolean;
  initialValues:
    | TransferEditInitialValues
    | {
        accountId: string;
        items: { amount: string; categoryId: string }[];
        merchantId: string;
        note: string;
        transactionAt: string;
        transactionRecordId: string;
        type: TransactionType;
      };
  ledgerName: string;
};
