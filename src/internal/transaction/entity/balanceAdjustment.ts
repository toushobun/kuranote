export type BalanceAdjustmentEditInitialValues = {
  type: "balance_adjustment";
  accountId: string;
  accountIconUrl?: string | null;
  accountName: string;
  currency: string;
  signedDelta: string;
  transactionAt: string;
  transactionRecordId: string;
  note: string;
  accountArchived: boolean;
};
