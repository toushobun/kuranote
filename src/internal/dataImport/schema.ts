import type { ImportSheetKind } from "internal/dataImport/entity/importSheetKind";

export type ImportColumnDef = {
  name: string;
  required: boolean;
};

/** 「收支」sheet 列定义，顺序仅用于模板说明展示，解析时按列名匹配、不要求顺序。 */
export const incomeExpenseColumns: ImportColumnDef[] = [
  { name: "账单关联", required: false },
  { name: "日期", required: true },
  { name: "记账人", required: false },
  { name: "商家分类", required: false },
  { name: "商家", required: true },
  { name: "交易类型", required: true },
  { name: "一级分类", required: true },
  { name: "二级分类", required: false },
  { name: "账户", required: true },
  { name: "账户持有人", required: false },
  { name: "账户币种", required: true },
  { name: "金额", required: true },
  { name: "备注", required: false },
];

/** 「转账」sheet 列定义。 */
export const transferColumns: ImportColumnDef[] = [
  { name: "交易类型", required: true },
  { name: "日期", required: true },
  { name: "记账人", required: false },
  { name: "转出账户", required: true },
  { name: "转出账户币种", required: true },
  { name: "转出账户持有人", required: false },
  { name: "转入账户", required: true },
  { name: "转入账户币种", required: true },
  { name: "转入账户持有人", required: false },
  { name: "金额", required: true },
  { name: "备注", required: false },
];

/** 「余额变更」sheet 列定义：本期仅用于识别，不解析内容（见 #755）。 */
export const balanceAdjustmentColumns: ImportColumnDef[] = [
  { name: "交易类型", required: true },
  { name: "日期", required: true },
  { name: "记账人", required: false },
  { name: "账户", required: true },
  { name: "账户币种", required: true },
  { name: "账户持有人", required: false },
  { name: "金额", required: true },
  { name: "备注", required: false },
];

export const importColumnsBySheetKind: Record<
  ImportSheetKind,
  ImportColumnDef[]
> = {
  balanceAdjustment: balanceAdjustmentColumns,
  incomeExpense: incomeExpenseColumns,
  transfer: transferColumns,
};

export const incomeExpenseTypeValues = ["支出", "收入"] as const;
export const transferTypeValue = "转账";

export const importNoteMaxLength = 2000;
export const importCurrencyPattern = /^[A-Za-z]{3}$/;
