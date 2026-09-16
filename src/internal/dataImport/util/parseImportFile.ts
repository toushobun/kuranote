import type { ParsedTable } from "internal/dataImport/entity/parsedTable";
import { parseCsv } from "internal/dataImport/util/csvParser";
import { parseXlsxWorkbook } from "internal/dataImport/util/xlsxParser";

export type ParseImportFileResult =
  | { message: string; ok: false }
  | { ok: true; tables: ParsedTable[] };

function parseCsvBuffer(buffer: ArrayBuffer, fileName: string): ParsedTable[] {
  const text = new TextDecoder("utf-8").decode(buffer);
  const rows = parseCsv(text);

  if (rows.length === 0) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;

  return [
    {
      headerRow,
      rows: dataRows.map((cells, index) => ({ cells, rowNumber: index + 2 })),
      sourceName: fileName,
    },
  ];
}

/** 按文件扩展名分派 CSV / xlsx 解析，统一转换为 ParsedTable 数组。 */
export async function parseImportFile(
  fileName: string,
  buffer: ArrayBuffer,
): Promise<ParseImportFileResult> {
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith(".csv")) {
    return { ok: true, tables: parseCsvBuffer(buffer, fileName) };
  }

  if (lowerName.endsWith(".xlsx")) {
    try {
      return { ok: true, tables: await parseXlsxWorkbook(buffer) };
    } catch {
      return {
        message: "文件无法解析，请确认文件未损坏且是有效的 xlsx 文件。",
        ok: false,
      };
    }
  }

  return { message: "仅支持 CSV 或 xlsx 文件。", ok: false };
}
