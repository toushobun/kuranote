import type { ParsedTable } from "internal/dataImport/entity/parsedTable";
import { importStructuralErrorMessages } from "internal/dataImport/errors";
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
    return {
      message: importStructuralErrorMessages.fileTypeUnsupported,
      ok: false,
    };
  }

  try {
    return { ok: true, tables: await parseXlsxWorkbook(buffer) };
  } catch {
    return {
      message: importStructuralErrorMessages.fileUnreadable,
      ok: false,
    };
  }
}
