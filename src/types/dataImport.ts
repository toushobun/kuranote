import type {
  ImportBatchResult,
  ImportHolderMapping,
  ImportValidationResult,
} from "internal/dataImport";
import type { BaseActionState } from "types/auth";

export type DataImportActionState = BaseActionState & {
  errorKey?: string;
  result?: ImportValidationResult;
};

export type DataImportBatchActionState = BaseActionState & {
  batch?: ImportBatchResult;
  errorKey?: string;
  /**
   * 本批实际使用的持有人映射：新建待邀请成员的意图已换成占位 ID。
   * 浏览器端用它替换本地映射，后续批次不再重复提交新建意图。
   */
  resolvedHolderMapping?: ImportHolderMapping;
};

export type DataImportBatchStateAction = (
  previousState: DataImportBatchActionState,
  formData: FormData,
) => Promise<DataImportBatchActionState>;
