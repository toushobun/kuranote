export type TransactionTimestampFormat = "form" | "import";

const minTimeZoneOffsetMinutes = -840;
const maxTimeZoneOffsetMinutes = 840;

export function parseTimeZoneOffsetMinutes(value: string): number | null {
  if (!/^-?\d+$/.test(value)) return null;

  const offset = Number(value);
  if (
    !Number.isInteger(offset) ||
    offset < minTimeZoneOffsetMinutes ||
    offset > maxTimeZoneOffsetMinutes
  ) {
    return null;
  }

  return offset;
}

export function toTransactionTimestamp(
  value: string,
  offsetMinutes: number,
  format: TransactionTimestampFormat,
): string | null {
  if (
    !Number.isInteger(offsetMinutes) ||
    offsetMinutes < minTimeZoneOffsetMinutes ||
    offsetMinutes > maxTimeZoneOffsetMinutes
  ) {
    return null;
  }

  const pattern =
    format === "form"
      ? /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
      : /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
  const match = value.match(pattern);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] =
    match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText ?? "0");
  const utcLikeDate = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second),
  );

  if (
    utcLikeDate.getUTCFullYear() !== year ||
    utcLikeDate.getUTCMonth() !== month - 1 ||
    utcLikeDate.getUTCDate() !== day ||
    utcLikeDate.getUTCHours() !== hour ||
    utcLikeDate.getUTCMinutes() !== minute ||
    utcLikeDate.getUTCSeconds() !== second
  ) {
    return null;
  }

  return new Date(
    utcLikeDate.getTime() + offsetMinutes * 60 * 1000,
  ).toISOString();
}
