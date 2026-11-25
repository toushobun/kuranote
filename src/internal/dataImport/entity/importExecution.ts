import type { ImportSheetKind } from "internal/dataImport/entity/importSheetKind";

export type ImportExecutionSheetKind = ImportSheetKind;

export type ImportExecutionDetail = {
  content: string;
  reason: string;
  rowNumbers: number[];
  sheet: ImportExecutionSheetKind;
  status: "failed" | "holderMissing";
};

export type ImportBatchResult = {
  /** 本批为新建意图实际新建的待邀请成员数（复用同名待邀请成员不计入）。 */
  createdPlaceholderCount: number;
  details: ImportExecutionDetail[];
  failureCount: number;
  holderMissingCount: number;
  successCount: number;
};

export type ImportExecutionResult = {
  createdPlaceholderCount: number;
  details: ImportExecutionDetail[];
  failureCount: number;
  holderMissingCount: number;
  successCount: number;
};
