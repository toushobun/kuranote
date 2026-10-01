import type {
  ImportBatchResult,
  ImportHolderMapping,
  ImportValidationResult,
} from "internal/dataImport";
import type { ActionState } from "types/actions";

export type DataImportActionState = ActionState & {
  result?: ImportValidationResult;
};

export type DataImportBatchActionState = ActionState & {
  batch?: ImportBatchResult;
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
