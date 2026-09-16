export type ParseImportAmountResult =
  | { ok: false }
  | { ok: true; value: number };

// 与 src/internal/shared/schema/formValidation.ts 的 parseMoneyAmount 保持一致：
// 最多两位小数，不接受千分位分隔符等格式。
const moneyAmountPattern = /^-?\d+(\.\d{1,2})?$/;

/** 解析「金额」列文本：要求非负、最多两位小数；`allowZero` 默认允许 0。 */
export function parseImportAmount(
  cellText: string,
  options: { allowZero?: boolean } = {},
): ParseImportAmountResult {
  const text = cellText.trim();

  if (!moneyAmountPattern.test(text)) {
    return { ok: false };
  }

  const amount = Number(text);

  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false };
  }

  if (amount === 0 && options.allowZero === false) {
    return { ok: false };
  }

  return { ok: true, value: amount };
}
