import type { ImportValidationResult } from "internal/dataImport/entity/importValidationIssue";
import { parseImportFile } from "internal/dataImport/util/parseImportFile";
import { validateImportWorkbook } from "internal/dataImport/util/validateImportWorkbook";

export type CheckImportFileInput = {
  fileBuffer: ArrayBuffer;
  fileName: string;
};

export interface DataImportValidationService {
  checkFile(input: CheckImportFileInput): Promise<ImportValidationResult>;
}

/**
 * 本 Service 只做"选择文件 + 检查格式"的纯校验，不读写数据库、不做账户 /
 * 分类 / 商家的存在性匹配——那些留给后续"导入执行"子 Issue。因此不需要
 * Repository，也不接入 RequestContainer。
 */
export function createDataImportValidationService(): DataImportValidationService {
  return {
    async checkFile({ fileBuffer, fileName }) {
      const parsed = await parseImportFile(fileName, fileBuffer);

      if (!parsed.ok) {
        return {
          issues: [{ kind: "structural", message: parsed.message }],
          ok: false,
        };
      }

      return validateImportWorkbook(parsed.tables);
    },
  };
}
