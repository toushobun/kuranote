import type { EmbeddedWorksheetPhoto } from "internal/dataImport/entity/parsedTable";
import { importPhotoValidationMessages } from "internal/dataImport/errors";
import type { ImportExecutionUnit } from "internal/dataImport/entity/importRow";
import type {
  ImportRowIssue,
  ImportValidationResult,
} from "internal/dataImport/entity/importValidationIssue";
import {
  dataImportErrorCodes,
  dataImportErrorMessages,
} from "internal/dataImport/errors";
import { maxImportFileSizeBytes } from "internal/dataImport/schema";
import { parseImportFile } from "internal/dataImport/util/parseImportFile";
import { analyzeImportWorkbook } from "internal/dataImport/util/validateImportWorkbook";

export type AnalyzeImportFileResult = {
  result: ImportValidationResult;
  /** 仅在 `result.ok` 时非空：按「收支」「转账」「余额变更」的顺序展开的全部执行单元。 */
  units: ImportExecutionUnit[];
  photosByRow?: Map<number, EmbeddedWorksheetPhoto[]>;
};

/**
 * 浏览器端一次性解析并校验导入文件：文件本身不会上传到服务器，校验通过后
 * 返回的执行单元由调用方分批发给 Server Action。本函数不读写数据库。
 */
export async function analyzeImportFile(
  file: File,
): Promise<AnalyzeImportFileResult> {
  if (file.size > maxImportFileSizeBytes) {
    return {
      result: {
        issues: [
          {
            kind: "structural",
            message: dataImportErrorMessages[dataImportErrorCodes.fileTooLarge],
          },
        ],
        ok: false,
      },
      units: [],
    };
  }

  const parsed = await parseImportFile(file.name, await file.arrayBuffer());
  if (!parsed.ok) {
    return {
      result: {
        issues: [{ kind: "structural", message: parsed.message }],
        ok: false,
      },
      units: [],
    };
  }

  const analyzed = analyzeImportWorkbook(parsed.tables);
  if (!analyzed.result.ok || !analyzed.photosByRow) return analyzed;

  // 使用完即关闭位图，防止一次性导入大文件时持续占用移动端图片内存。
  if (typeof createImageBitmap === "function") {
    const issues: ImportRowIssue[] = [];
    for (const [rowNumber, images] of analyzed.photosByRow) {
      for (const photo of images) {
        try {
          const bitmap = await createImageBitmap(
            new Blob([new Uint8Array(photo.bytes)], { type: photo.mimeType }),
          );
          bitmap.close();
        } catch {
          issues.push({
            column: photo.columnName,
            kind: "row",
            message: importPhotoValidationMessages.unreadable,
            rowNumber,
            sheet: "incomeExpense",
          });
        }
      }
    }
    if (issues.length) return { result: { issues, ok: false }, units: [] };
  }
  return analyzed;
}
