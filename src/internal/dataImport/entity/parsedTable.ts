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
  photoIssues?: import("internal/dataImport/entity/importValidationIssue").ImportRowIssue[];
  photos?: EmbeddedWorksheetPhoto[];
  headerRow: string[];
  rows: ParsedTableRow[];
  sourceName: string;
};
