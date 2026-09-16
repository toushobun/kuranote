/** 按列名建立「列名 → 列下标」映射；同名列取第一次出现的位置。 */
export function buildColumnIndex(headerRow: string[]): Record<string, number> {
  const index: Record<string, number> = {};

  headerRow.forEach((name, columnPosition) => {
    const trimmedName = name.trim();
    if (trimmedName && index[trimmedName] === undefined) {
      index[trimmedName] = columnPosition;
    }
  });

  return index;
}

export function findMissingRequiredColumns(
  columnIndex: Record<string, number>,
  columns: { name: string; required: boolean }[],
): string[] {
  return columns
    .filter(
      (column) => column.required && columnIndex[column.name] === undefined,
    )
    .map((column) => column.name);
}
