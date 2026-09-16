import type { ImportSheetKind } from "internal/dataImport/entity/importSheetKind";

/**
 * CSV 文件只能承载单一表格，没有 xlsx 的 sheet 概念；因此不依赖 xlsx 的
 * 工作表名称，而是按表头列名的特征列组合来识别一个表格属于「收支」
 * 「转账」「余额变更」中的哪一种——这一识别方式对 CSV 单表和 xlsx 的每个
 * 工作表统一生效。
 *
 * - 「收支」独有：同时包含"商家"与"一级分类"列。
 * - 「转账」独有：同时包含"转出账户"与"转入账户"列。
 * - 「余额变更」：包含"账户"与"交易类型"，但不满足上述两种特征
 *   （其列集合是「收支」列集合去掉商家/分类/账单关联等列后的子集）。
 */
export function detectSheetKind(headerRow: string[]): ImportSheetKind | null {
  const headers = new Set(headerRow.map((name) => name.trim()));
  const has = (name: string) => headers.has(name);

  if (has("商家") && has("一级分类")) {
    return "incomeExpense";
  }

  if (has("转出账户") && has("转入账户")) {
    return "transfer";
  }

  if (has("账户") && has("交易类型")) {
    return "balanceAdjustment";
  }

  return null;
}
