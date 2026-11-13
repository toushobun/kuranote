const minorUnitScale = BigInt(1000);

/**
 * 将金额转换为以 0.001 为单位的整数，覆盖项目支持的最大币种精度。
 * 不经过浮点运算，直接解析输入字符串的小数位。
 */
export function toRefundMinorUnits(value: number | string): bigint | null {
  const text = String(value).trim();
  const match = text.match(/^(\d+)(?:\.(\d{1,3}))?$/);
  if (!match) return null;

  const whole = match[1];
  const fraction = (match[2] ?? "").padEnd(3, "0");
  try {
    return BigInt(whole) * minorUnitScale + BigInt(fraction);
  } catch {
    return null;
  }
}

/** 将以 0.001 为单位的整数转换为金额字符串，并移除末尾多余的 0。 */
export function formatRefundMinorUnits(units: bigint): string {
  const negative = units < BigInt(0);
  const absoluteUnits = negative ? -units : units;
  const whole = absoluteUnits / minorUnitScale;
  const fraction = String(absoluteUnits % minorUnitScale).padStart(3, "0");
  const trimmedFraction = fraction.replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${
    trimmedFraction ? `.${trimmedFraction}` : ""
  }`;
}

/**
 * 按原始金额减去退款与报销核销金额计算有符号剩余额度。
 * 正数表示仍未结清，0 表示恰好结清，负数表示核销已超过原始金额。
 * 输入精度无效时返回 null。
 */
export function calculateRemainingOffsetMinorUnits(
  amount: number | string,
  refundedAmount: number | string,
  reimbursementAmount: number | string,
): bigint | null {
  const amountUnits = toRefundMinorUnits(amount);
  const refundedUnits = toRefundMinorUnits(refundedAmount);
  const reimbursementUnits = toRefundMinorUnits(reimbursementAmount);
  if (
    amountUnits === null ||
    refundedUnits === null ||
    reimbursementUnits === null
  ) {
    return null;
  }

  return amountUnits - refundedUnits - reimbursementUnits;
}

/**
 * 单目标退款与报销关联共用的金额摘要。
 * 全额写入单目标关联；原支出只抵到零，超出部分成为当前收入明细的业务净额。
 */
function summarizeSingleTargetAllocationAmounts(
  incomeAmount: number | string,
  remainingRefundableAmount: number | string,
) {
  const incomeUnits = toRefundMinorUnits(incomeAmount);
  if (incomeUnits === null) return null;

  const remainingText = String(remainingRefundableAmount).trim();
  const isNegative = remainingText.startsWith("-");
  const remainingMagnitude = toRefundMinorUnits(
    isNegative ? remainingText.slice(1) : remainingText,
  );
  if (remainingMagnitude === null) return null;
  const remainingUnits = isNegative ? -remainingMagnitude : remainingMagnitude;
  const offsetUnits =
    remainingUnits > BigInt(0)
      ? incomeUnits < remainingUnits
        ? incomeUnits
        : remainingUnits
      : BigInt(0);

  return {
    allocatedAmount: formatRefundMinorUnits(incomeUnits),
    incomeAmount: formatRefundMinorUnits(incomeUnits),
    netIncomeAmount: formatRefundMinorUnits(incomeUnits - offsetUnits),
  };
}

/** 单目标退款关联的金额摘要。 */
export const summarizeRefundAllocationAmounts =
  summarizeSingleTargetAllocationAmounts;

/** 单目标报销关联的金额摘要。 */
export const summarizeReimbursementAllocationAmounts =
  summarizeSingleTargetAllocationAmounts;
