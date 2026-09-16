import type { ImportSheetKind } from "internal/dataImport/entity/importSheetKind";

export type ImportStructuralIssue = {
  kind: "structural";
  message: string;
  sheet?: ImportSheetKind;
};

export type ImportRowIssue = {
  column?: string;
  kind: "row";
  message: string;
  rowNumber: number;
  sheet: ImportSheetKind;
};

export type ImportValidationIssue = ImportStructuralIssue | ImportRowIssue;

export type ImportValidationSummary = {
  balanceAdjustmentDetected: boolean;
  incomeExpenseCount: number;
  transferCount: number;
};

export type ImportValidationResult =
  | { issues: ImportValidationIssue[]; ok: false }
  | { ok: true; summary: ImportValidationSummary };
