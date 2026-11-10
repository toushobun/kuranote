import { transactionSetupHintMessages } from "config/transactionMessages";

export type TransactionSetupHint = {
  description: string;
  title: string;
};

// 转账至少需要两个账户，不足时返回提示内容。
export function getTransferTransactionSetupHint(
  accountCount: number,
): TransactionSetupHint | null {
  if (accountCount >= 2) return null;

  return accountCount === 0
    ? transactionSetupHintMessages.transferMissingTwoAccounts
    : transactionSetupHintMessages.transferMissingOneAccount;
}
