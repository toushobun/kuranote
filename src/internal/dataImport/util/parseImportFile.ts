import type { ParsedTable } from "internal/dataImport/entity/parsedTable";
import { parseXlsxWorkbook } from "internal/dataImport/util/xlsxParser";

export type ParseImportFileResult =
  | { message: string; ok: false }
  | { ok: true; tables: ParsedTable[] };

/** 解析 xlsx 文件，统一转换为 ParsedTable 数组。 */
export async function parseImportFile(
  fileName: string,
  buffer: ArrayBuffer,
): Promise<ParseImportFileResult> {
  const lowerName = fileName.toLowerCase();

  if (!lowerName.endsWith(".xlsx")) {
    return { message: "仅支持 xlsx 文件。", ok: false };
  }

  try {
    return { ok: true, tables: await parseXlsxWorkbook(buffer) };
  } catch {
    return {
      message: "文件无法解析，请确认文件未损坏且是有效的 xlsx 文件。",
      ok: false,
    };
  }
}
