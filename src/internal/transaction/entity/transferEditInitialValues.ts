export type TransferEditInitialValues = {
  type: "transfer";
  transactionRecordId: string;
  transactionAt: string;
  accountId: string;
  transferTargetAccountId: string;
  transferAmount: string;
  note: string;
};
