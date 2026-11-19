import ExcelJS from "exceljs";

import { importSheetKindLabels } from "internal/dataImport/entity/importSheetKind";
import { readWorksheetPhotos } from "internal/dataImport/util/readWorksheetPhotos";
import type { ParsedTable } from "internal/dataImport/entity/parsedTable";
import { cellToText } from "internal/dataImport/util/cellText";

function isBlankRow(cells: string[]) {
  return cells.every((cell) => cell.trim().length === 0);
}

/** 解析 xlsx workbook，每个非空工作表转换为一个 ParsedTable（含表头行）。 */
export async function parseXlsxWorkbook(
  buffer: ArrayBuffer,
): Promise<ParsedTable[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const tables: ParsedTable[] = [];

  for (const worksheet of workbook.worksheets) {
    const columnCount = worksheet.actualColumnCount;
    const dataRows: { cells: string[]; rowNumber: number }[] = [];
    let headerRow: string[] | null = null;
    let headerRowNumber = 0;

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const cells: string[] = [];
      for (
        let column = 1;
        column <= Math.max(columnCount, row.cellCount);
        column += 1
      ) {
        cells.push(cellToText(row.getCell(column).value));
      }

      if (isBlankRow(cells)) {
        return;
      }

      if (!headerRow) {
        headerRow = cells;
        headerRowNumber = rowNumber;
        return;
      }

      dataRows.push({ cells, rowNumber });
    });

    if (!headerRow) {
      continue;
    }

    const photos =
      worksheet.name.trim() === importSheetKindLabels.incomeExpense
        ? readWorksheetPhotos(workbook, worksheet, headerRow, headerRowNumber)
        : null;
    tables.push({
      headerRow,
      rows: dataRows,
      sourceName: worksheet.name,
      ...(photos?.images.length ? { photos: photos.images } : {}),
      ...(photos?.issues.length ? { photoIssues: photos.issues } : {}),
    });
  }

  return tables;
}
