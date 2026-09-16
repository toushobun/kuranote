export const importSheetKinds = [
  "incomeExpense",
  "transfer",
  "balanceAdjustment",
] as const;

export type ImportSheetKind = (typeof importSheetKinds)[number];

export const importSheetKindLabels: Record<ImportSheetKind, string> = {
  incomeExpense: "收支",
  transfer: "转账",
  balanceAdjustment: "余额变更",
};
