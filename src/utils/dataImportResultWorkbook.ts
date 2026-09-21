import ExcelJS from "exceljs";

import { dataImportExecutionMessages } from "config/dataImportExportMessages";
import {
  importSheetKindLabels,
  type ImportExecutionRowResult,
  type ImportExecutionSheetKind,
} from "internal/dataImport";

function resultLabel(status: ImportExecutionRowResult["status"]) {
  if (status === "failed") return dataImportExecutionMessages.resultFailed;
  if (status === "duplicate") {
    return dataImportExecutionMessages.resultDuplicate;
  }
  if (status === "holderMissing") {
    return dataImportExecutionMessages.resultHolderMissing;
  }
  return dataImportExecutionMessages.resultSuccess;
}

export function buildDataImportResultFileName(fileName: string) {
  const baseName = fileName.toLowerCase().endsWith(".xlsx")
    ? fileName.slice(0, -5)
    : fileName;
  return `${baseName}${dataImportExecutionMessages.resultFileSuffix}`;
}

/**
 * 保留原 workbook 内容，只在「收支」「转账」表最右侧追加导入结果和原因两列。
 * rowNumber 使用格式校验阶段保留下来的真实 Excel 行号，因此即使表头前存在空行，
 * 结果仍会回填到正确的源行。
 */
export async function buildDataImportResultWorkbook(
  source: ArrayBuffer,
  rowResults: ImportExecutionRowResult[],
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(source);

  const resultsBySheet = new Map<
    ImportExecutionSheetKind,
    Map<number, ImportExecutionRowResult>
  >();
  for (const result of rowResults) {
    const rows = resultsBySheet.get(result.sheet) ?? new Map();
    rows.set(result.rowNumber, result);
    resultsBySheet.set(result.sheet, rows);
  }

  const sheetKinds: ImportExecutionSheetKind[] = [
    "incomeExpense",
    "transfer",
    "balanceAdjustment",
  ];
  for (const sheetKind of sheetKinds) {
    // 与 detectSheetKind 保持一致按 trim 后的名称匹配，避免原表 sheet 名带有
    // 多余空格时，导入本身成功但结果文件因精确匹配失败而漏写该表的结果列。
    const worksheet = workbook.worksheets.find(
      (candidate) => candidate.name.trim() === importSheetKindLabels[sheetKind],
    );
    if (!worksheet) continue;

    let headerRowNumber: number | null = null;
    worksheet.eachRow({ includeEmpty: false }, (_row, rowNumber) => {
      if (headerRowNumber === null) headerRowNumber = rowNumber;
    });
    if (headerRowNumber === null) continue;

    const resultColumn = worksheet.actualColumnCount + 1;
    const reasonColumn = resultColumn + 1;
    const header = worksheet.getRow(headerRowNumber);
    header.getCell(resultColumn).value =
      dataImportExecutionMessages.resultColumnTitle;
    header.getCell(reasonColumn).value =
      dataImportExecutionMessages.reasonColumnTitle;

    for (const [rowNumber, result] of resultsBySheet.get(sheetKind) ?? []) {
      const row = worksheet.getRow(rowNumber);
      row.getCell(resultColumn).value = resultLabel(result.status);
      row.getCell(reasonColumn).value = result.reason ?? "";
    }
  }

  return (await workbook.xlsx.writeBuffer()) as unknown as ArrayBuffer;
}
