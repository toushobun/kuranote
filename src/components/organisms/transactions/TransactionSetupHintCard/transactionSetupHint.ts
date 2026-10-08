import { transactionSetupHintMessages } from "config/transactionMessages";

export type TransactionSetupTarget = "account" | "merchant";

export type TransactionSetupHint = {
  description: string;
  targets: TransactionSetupTarget[];
  title: string;
};

// 收支记账至少需要一个账户和一个商家，缺少时返回提示内容。
export function getNormalTransactionSetupHint({
  accountCount,
  merchantCount,
}: {
  accountCount: number;
  merchantCount: number;
}): TransactionSetupHint | null {
  const missingAccount = accountCount === 0;
  const missingMerchant = merchantCount === 0;

  if (missingAccount && missingMerchant) {
    return {
      ...transactionSetupHintMessages.missingAccountAndMerchant,
      targets: ["account", "merchant"],
    };
  }
  if (missingMerchant) {
    return {
      ...transactionSetupHintMessages.missingMerchant,
      targets: ["merchant"],
    };
  }
  if (missingAccount) {
    return {
      ...transactionSetupHintMessages.missingAccount,
      targets: ["account"],
    };
  }

  return null;
}

// 转账至少需要两个账户，不足时返回提示内容。
export function getTransferTransactionSetupHint(
  accountCount: number,
): TransactionSetupHint | null {
  if (accountCount >= 2) return null;

  return {
    ...(accountCount === 0
      ? transactionSetupHintMessages.transferMissingTwoAccounts
      : transactionSetupHintMessages.transferMissingOneAccount),
    targets: ["account"],
  };
}
