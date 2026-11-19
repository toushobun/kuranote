import ExcelJS from "exceljs";

import type { EmbeddedWorksheetPhoto } from "internal/dataImport/entity/parsedTable";
import type { ImportRowIssue } from "internal/dataImport/entity/importValidationIssue";
import { importPhotoValidationMessages } from "internal/dataImport/errors";
import { incomeExpensePhotoColumnNames } from "internal/dataImport/schema";

function mimeForImage(
  bytes: Uint8Array,
): EmbeddedWorksheetPhoto["mimeType"] | null {
  if (
    bytes.length >= 4 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  )
    return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
    return "image/png";
  return null;
}

/** 读取浮动图片的锚点和原图，列名可替换以便未来适配其他 XLSX 格式。 */
export function readWorksheetPhotos(
  workbook: ExcelJS.Workbook,
  worksheet: ExcelJS.Worksheet,
  header: string[],
  headerRowNumber: number,
  photoColumnNames: readonly string[] = incomeExpensePhotoColumnNames,
): { images: EmbeddedWorksheetPhoto[]; issues: ImportRowIssue[] } {
  const images: EmbeddedWorksheetPhoto[] = [];
  const issues: ImportRowIssue[] = [];
  const seenCells = new Set<string>();
  const perRow = new Map<number, number>();
  const addIssue = (rowNumber: number, column: string, message: string) => {
    issues.push({
      column,
      kind: "row",
      message,
      rowNumber,
      sheet: "incomeExpense",
    });
  };

  for (const picture of worksheet.getImages()) {
    const rowNumber = picture.range.tl.nativeRow + 1;
    const columnIndex = picture.range.tl.nativeCol;
    const columnName = header[columnIndex] ?? "";
    if (
      rowNumber <= headerRowNumber ||
      !photoColumnNames.includes(columnName)
    ) {
      addIssue(
        rowNumber,
        columnName,
        importPhotoValidationMessages.invalidPosition,
      );
      continue;
    }
    const key = `${rowNumber}:${columnIndex}`;
    if (seenCells.has(key)) {
      addIssue(rowNumber, columnName, importPhotoValidationMessages.duplicate);
      continue;
    }
    seenCells.add(key);
    const count = (perRow.get(rowNumber) ?? 0) + 1;
    perRow.set(rowNumber, count);
    if (count > photoColumnNames.length) {
      addIssue(rowNumber, columnName, importPhotoValidationMessages.tooMany);
      continue;
    }
    let bytes: Uint8Array;
    try {
      const asset = workbook.getImage(picture.imageId);
      if (!asset?.buffer) throw new Error("image buffer missing");
      bytes = new Uint8Array(asset.buffer);
    } catch {
      addIssue(rowNumber, columnName, importPhotoValidationMessages.unreadable);
      continue;
    }
    const mimeType = mimeForImage(bytes);
    if (!mimeType) {
      addIssue(rowNumber, columnName, importPhotoValidationMessages.unreadable);
      continue;
    }
    images.push({ bytes, columnName, mimeType, rowNumber });
  }
  return { images, issues };
}
