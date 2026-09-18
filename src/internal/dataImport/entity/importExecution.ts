import type { ImportSheetKind } from "internal/dataImport/entity/importSheetKind";

export type ImportExecutionSheetKind = Exclude<
  ImportSheetKind,
  "balanceAdjustment"
>;

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
  details: ImportExecutionDetail[];
  done: boolean;
  duplicateCount: number;
  failureCount: number;
  holderMissingCount: number;
  nextOffset: number;
  processedCount: number;
  rowResults: ImportExecutionRowResult[];
  successCount: number;
  totalCount: number;
};

export type ImportExecutionResult = {
  details: ImportExecutionDetail[];
  duplicateCount: number;
  failureCount: number;
  holderMissingCount: number;
  processedCount: number;
  rowResults: ImportExecutionRowResult[];
  successCount: number;
  totalCount: number;
};
