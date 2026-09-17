import type { ImportBatchResult, ImportValidationResult } from "internal/dataImport";
import type { BaseActionState } from "types/auth";

export type DataImportActionState = BaseActionState & {
  errorKey?: string;
  result?: ImportValidationResult;
};

export type DataImportBatchActionState = BaseActionState & {
  batch?: ImportBatchResult;
  errorKey?: string;
};

export type DataImportStateAction = (
  previousState: DataImportActionState,
  formData: FormData,
) => Promise<DataImportActionState>;

export type DataImportBatchStateAction = (
  previousState: DataImportBatchActionState,
  formData: FormData,
) => Promise<DataImportBatchActionState>;
