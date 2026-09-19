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

/**
 * 「收支」表里「账单关联」分组共用的字段：一组账单关联记录里只有第一次出现
 * 的行提供真实值，后续行必须填字面 `-` 继承首行的值，或原样复述首行内容。
 * 「记账人」列本身不会被读取（见 `recorderColumnHint`），不参与共享字段
 * 一致性校验，因此不在此列表中。
 */
export const incomeExpenseSharedColumns = [
  "日期",
  "账户",
  "账户持有人",
  "账户币种",
  "商家",
  "商家分类",
  "备注",
] as const;

export type IncomeExpenseSharedColumn =
  (typeof incomeExpenseSharedColumns)[number];

/** 「收支」表里每一行都要各自单独填写、不受「账单关联」共享规则影响的字段。 */
export const incomeExpenseRepeatableColumns = [
  "一级分类",
  "二级分类",
  "交易类型",
  "金额",
] as const;

export const incomeExpenseTypeValues = ["支出", "收入"] as const;
export const transferTypeValue = "转账";

export const importNoteMaxLength = 2000;

/** 单次 Server Action 请求最多携带的执行单元数，客户端切批与服务端校验共用。 */
export const importBatchSize = 25;

/** 浏览器端解析文件前的大小上限；文件不会上传到服务器，只受浏览器内存约束。 */
export const maxImportFileSizeBytes = 50 * 1024 * 1024;
export const importCurrencyPattern = /^[A-Za-z]{3}$/;
