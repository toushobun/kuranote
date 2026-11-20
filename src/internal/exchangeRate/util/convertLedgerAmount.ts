/** 与 SQL convert_ledger_amount 相同：先按记录计算净额，再对绝对值四舍五入。 */
export function convertLedgerAmount(
  amount: number | string,
  rate: number | string | null | undefined,
): number | null {
  if (rate === null) return null;
  const amountValue = Number(amount);
  const rateValue = Number(rate ?? 1);
  if (!Number.isFinite(amountValue) || !Number.isFinite(rateValue) || rateValue <= 0) return null;
  const value = amountValue * rateValue;
  if (!Number.isFinite(value)) return null;
  // 使用绝对值舍入，保持与 PostgreSQL numeric round 的负数半入行为一致。
  return Math.sign(value) * Math.round((Math.abs(value) + 1e-10) * 100) / 100;
}
