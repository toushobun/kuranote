export type ParseImportDateResult = { ok: false } | { ok: true; value: string };

const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * 解析「日期」列文本：要求 `YYYY-MM-DD` 格式（零填充），并校验是真实存在的日期
 * （拒绝如 2026-02-30 这类日历上不存在的日期）。返回值原样为 `YYYY-MM-DD`。
 */
export function parseImportDate(cellText: string): ParseImportDateResult {
  const text = cellText.trim();
  const match = text.match(datePattern);

  if (!match) {
    return { ok: false };
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { ok: false };
  }

  return { ok: true, value: text };
}
