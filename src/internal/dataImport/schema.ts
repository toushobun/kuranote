import { z } from "@hono/zod-openapi";

import type { ImportSheetKind } from "internal/dataImport/entity/importSheetKind";
import { ledgerPlaceholderMemberNameMaxLength } from "internal/ledger";

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

/** 「余额变更」sheet 列定义：金额为带符号的余额差值。 */
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
export const balanceAdjustmentTypeValue = "余额变更";

export const importNoteMaxLength = 2000;

/** 单次 Server Action 请求最多携带的执行单元数，客户端切批与服务端校验共用。 */
export const importBatchSize = 100;

/** 浏览器端解析文件前的大小上限；文件不会上传到服务器，只受浏览器内存约束。 */
export const maxImportFileSizeBytes = 50 * 1024 * 1024;
export const importCurrencyPattern = /^[A-Za-z]{3}$/;

/** 账户、商家、分类、持有人等名称单元格的最大长度，客户端提交的行数据与映射共用。 */
export const importNameMaxLength = 200;

/** 持有人映射最多携带的姓名数；只有无法唯一匹配成员的姓名需要映射。 */
export const importHolderMappingMaxEntries = 500;

/**
 * 持有人映射的一个取值，四种意图互斥：真实成员、无持有人、现有待邀请成员（按 ID），
 * 以及待创建的待邀请成员（只是意图，执行时才批量创建或复用）。
 * 多余或冲突的字段一律拒绝。
 */
const importHolderMappingValueSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("member"), userId: z.string().uuid() }),
  z.strictObject({ kind: z.literal("none") }),
  z.strictObject({
    kind: z.literal("placeholder"),
    placeholderId: z.string().uuid(),
  }),
  z.strictObject({
    displayName: z
      .string()
      .max(ledgerPlaceholderMemberNameMaxLength)
      .refine((value) => value.trim().length > 0),
    kind: z.literal("newPlaceholder"),
  }),
]);

/**
 * 文件里的持有人姓名 → 映射取值。映射里没有的姓名仍按显示名精确匹配账本成员，
 * 与显式选择「无持有人」含义不同。新建待邀请成员只能沿用文件里的姓名，不能改名。
 */
export const importHolderMappingSchema = z
  .record(
    z.string().min(1).max(importNameMaxLength),
    importHolderMappingValueSchema,
  )
  .refine(
    (mapping) => Object.keys(mapping).length <= importHolderMappingMaxEntries,
  )
  .refine((mapping) =>
    Object.entries(mapping).every(
      ([name, value]) =>
        value.kind !== "newPlaceholder" || value.displayName === name,
    ),
  );

export type ImportHolderMappingValue = z.infer<
  typeof importHolderMappingValueSchema
>;

export type ImportHolderMapping = z.infer<typeof importHolderMappingSchema>;

/** 已解析的映射取值：新建意图已经换成现有待邀请成员的 ID。 */
export type ResolvedImportHolderMappingValue = Exclude<
  ImportHolderMappingValue,
  { kind: "newPlaceholder" }
>;
