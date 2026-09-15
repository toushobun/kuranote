export function isAccountBalanceText(value: string): boolean {
  return /^-?\d+(\.\d{1,2})?$/.test(value) && Number.isFinite(Number(value));
}

export function isValidTargetBalance(value: number): boolean {
  return (
    Number.isFinite(value) &&
    Math.abs(value) < 1e12 &&
    Number(value.toFixed(2)) === value
  );
}
