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

/**
 * 找出表头里不属于该 sheet 类型已知列名（必填 + 选填）的列名，用于提醒用户
 * 列名写错——选填列写错名字不会触发缺列错误，但会被静默当成"未填写"处理，
 * 导致用户以为导入了实际却没有的数据被漏读。
 */
export function findUnknownColumns(
  headerRow: string[],
  columns: { name: string }[],
): string[] {
  const knownNames = new Set(columns.map((column) => column.name));
  const seen = new Set<string>();
  const unknown: string[] = [];

  for (const rawName of headerRow) {
    const name = rawName.trim();
    if (!name || knownNames.has(name) || seen.has(name)) {
      continue;
    }
    seen.add(name);
    unknown.push(name);
  }

  return unknown;
}
