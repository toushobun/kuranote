export type PaginationResult<T> = {
  items: T[];
  nextOffset: number | null;
  totalCount: number;
};

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
