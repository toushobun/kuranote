import type { ImportRowIssue } from "internal/dataImport/entity/importValidationIssue";

export type ParsedTableRow = {
  cells: string[];
  rowNumber: number;
};

export type EmbeddedWorksheetPhoto = {
  rowNumber: number;
  columnName: string;
  bytes: Uint8Array;
  mimeType: "image/jpeg" | "image/png";
};

export type ParsedTable = {
  photoIssues?: ImportRowIssue[];
  photos?: EmbeddedWorksheetPhoto[];
  headerRow: string[];
  rows: ParsedTableRow[];
  sourceName: string;
};
