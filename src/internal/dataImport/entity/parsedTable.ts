export type ParsedTableRow = {
  cells: string[];
  rowNumber: number;
};

export type ParsedTable = {
  headerRow: string[];
  rows: ParsedTableRow[];
  sourceName: string;
};
