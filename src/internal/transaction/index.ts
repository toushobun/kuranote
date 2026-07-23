import { transactionRouter } from "internal/transaction/router";

export {
  transactionErrorCodes,
  type EditTransactionErrorCode,
  type NewTransactionErrorCode,
  type TransactionErrorCode,
  type TransactionListErrorCode,
  type TransactionServiceErrorCode,
  type TransactionValidationErrorCode,
  type UpdateTransactionValidationErrorCode,
  type VoidTransactionValidationErrorCode,
} from "internal/transaction/errors";
export type { TransferEditInitialValues } from "internal/transaction/service/transactionFormService";

export const transactionModule = {
  basePath: "/transactions",
  name: "transaction",
  router: transactionRouter,
};
