export type PaginationResult<T> = {
  items: T[];
  nextOffset: number | null;
  totalCount: number;
};

/** 把数组按固定大小切成若干段，最后一段可以不满。 */
export function chunkArray<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

/** 按 key 分组，组内保持原有顺序。 */
export function groupByKey<T, K>(
  values: readonly T[],
  getKey: (value: T) => K,
) {
  const groups = new Map<K, T[]>();
  for (const value of values) {
    const key = getKey(value);
    const group = groups.get(key);
    if (group) group.push(value);
    else groups.set(key, [value]);
  }
  return groups;
}

export function mergeUniqueById<T extends { id: string }>(
  existing: T[],
  incoming: T[],
) {
  const existingIds = new Set(existing.map((item) => item.id));

  return [...existing, ...incoming.filter((item) => !existingIds.has(item.id))];
}

export function paginateItems<T>(
  items: T[],
  offset: number,
  pageSize: number,
): PaginationResult<T> {
  const safeOffset = Math.max(0, offset);
  const safePageSize = Math.max(0, pageSize);

  if (safePageSize === 0) {
    return {
      items: [],
      nextOffset: null,
      totalCount: items.length,
    };
  }

  const pageItems = items.slice(safeOffset, safeOffset + safePageSize);
  const nextOffset =
    safeOffset + safePageSize < items.length ? safeOffset + safePageSize : null;

  return {
    items: pageItems,
    nextOffset,
    totalCount: items.length,
  };
}
