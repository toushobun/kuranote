import type { ImportSheetKind } from "internal/dataImport/entity/importSheetKind";

export type ImportExecutionSheetKind = ImportSheetKind;

export type ImportExecutionRowStatus =
  | "duplicate"
  | "failed"
  | "holderMissing"
  | "success";

export type ImportExecutionRowResult = {
  reason: string | null;
  rowNumber: number;
  sheet: ImportExecutionSheetKind;
  status: ImportExecutionRowStatus;
};

export type ImportExecutionDetail = {
  content: string;
  reason: string;
  rowNumbers: number[];
  sheet: ImportExecutionSheetKind;
  status: Exclude<ImportExecutionRowStatus, "success">;
};

export type ImportBatchResult = {
  /** 本批为新建意图实际新建的待邀请成员数（复用同名待邀请成员不计入）。 */
  createdPlaceholderCount: number;
  details: ImportExecutionDetail[];
  duplicateCount: number;
  failureCount: number;
  holderMissingCount: number;
  processedCount: number;
  rowResults: ImportExecutionRowResult[];
  successCount: number;
};

export type ImportExecutionResult = {
  createdPlaceholderCount: number;
  details: ImportExecutionDetail[];
  duplicateCount: number;
  failureCount: number;
  holderMissingCount: number;
  processedCount: number;
  rowResults: ImportExecutionRowResult[];
  successCount: number;
  totalCount: number;
};
