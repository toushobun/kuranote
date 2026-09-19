/** 按实际返回条数继续读取，避免服务端行数上限导致静默截断。调用方须提供稳定排序。 */
export async function readAllPages<T>(
  readPage: (offset: number, limit: number) => Promise<T[]>,
): Promise<T[]> {
  const rows: T[] = [];
  for (;;) {
    const page = await readPage(rows.length, 500);
    if (page.length === 0) return rows;
    rows.push(...page);
  }
}
