import {
  importSheetKindLabels,
  type ImportSheetKind,
} from "internal/dataImport/entity/importSheetKind";

const sheetKindByLabel = new Map<string, ImportSheetKind>(
  (Object.entries(importSheetKindLabels) as [ImportSheetKind, string][]).map(
    ([kind, label]) => [label, kind],
  ),
);

/**
 * 按 xlsx 工作表名精确匹配表格类型：工作表名必须恰好是「收支」「转账」
 * 「余额变更」之一，不再按表头列名特征猜测。不匹配这三个名字的工作表
 * 返回 null，由调用方按「忽略、不算错误」处理。
 */
export function detectSheetKind(sheetName: string): ImportSheetKind | null {
  return sheetKindByLabel.get(sheetName.trim()) ?? null;
}
