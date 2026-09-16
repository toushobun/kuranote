import type { ImportValidationResult } from "internal/dataImport/entity/importValidationIssue";
import type { BaseActionState } from "types/auth";

export type DataImportActionState = BaseActionState & {
  errorKey?: string;
  result?: ImportValidationResult;
};

export type DataImportStateAction = (
  previousState: DataImportActionState,
  formData: FormData,
) => Promise<DataImportActionState>;
