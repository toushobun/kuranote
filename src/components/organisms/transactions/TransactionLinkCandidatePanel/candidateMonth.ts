/** 候选月份统一使用 Asia/Tokyo 的自然月，年月值在客户端、RPC 之间传 YYYY-MM。 */
export function toTokyoCandidateMonth(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
}

export function currentTokyoCandidateMonth(): string {
  return toTokyoCandidateMonth(new Date());
}

export function changeCandidateMonth(month: string, offset: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function candidateInMonth(
  transactionAt: string,
  month: string | null,
): boolean {
  return month === null || toTokyoCandidateMonth(transactionAt) === month;
}
