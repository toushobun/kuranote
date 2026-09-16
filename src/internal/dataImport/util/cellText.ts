import type { CellValue } from "exceljs";

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateCell(date: Date) {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(
    date.getUTCDate(),
  )}`;
}

/** 将 exceljs 单元格值统一转换为字符串，供后续解析逻辑按文本处理。 */
export function cellToText(value: CellValue): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return formatDateCell(value);
  }

  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((run) => run.text).join("");
    }

    if ("result" in value) {
      return cellToText(value.result as CellValue);
    }

    if ("text" in value) {
      return String(value.text);
    }

    return "";
  }

  return String(value).trim();
}
