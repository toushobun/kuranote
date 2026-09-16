export type ParseImportDateResult = { ok: false } | { ok: true; value: string };

const dateTimePattern = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

/**
 * 解析「日期」列文本：要求精确到秒的 `YYYY-MM-DD HH:MM:SS` 格式（零填充、
 * 24 小时制），不接受纯日期、不做缺省时间的兜底。校验是真实存在的日期
 * （拒绝如 2026-02-30 这类日历上不存在的日期）以及合法的时分秒范围。
 * 返回值原样为 `YYYY-MM-DD HH:MM:SS`。
 */
export function parseImportDate(cellText: string): ParseImportDateResult {
  const text = cellText.trim();
  const match = text.match(dateTimePattern);

  if (!match) {
    return { ok: false };
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] =
    match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);

  if (hour > 23 || minute > 59 || second > 59) {
    return { ok: false };
  }

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
