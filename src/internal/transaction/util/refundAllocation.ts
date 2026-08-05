export type TransactionRefundAllocation = {
  refundAmount: number;
  refundedItemId: string;
};

export type TransactionRefundAllocationTarget = {
  id: string;
  remainingRefundableAmount: string;
};

const minorUnitScale = BigInt(100);

/**
 * 金额を 0.01 单位の整数に変换する。
 * 浮動小数点演算を経由せず、入力文字列の小数桁を直接解釈する。
 */
export function toRefundMinorUnits(value: number | string): bigint | null {
  const text = String(value).trim();
  const match = text.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;

  const whole = match[1];
  const fraction = (match[2] ?? "").padEnd(2, "0");
  try {
    return BigInt(whole) * minorUnitScale + BigInt(fraction);
  } catch {
    return null;
  }
}

/** 0.01 单位の整数を、末尾の不要な 0 を除いた金额文字列に戻す。 */
export function formatRefundMinorUnits(units: bigint): string {
  const negative = units < BigInt(0);
  const absoluteUnits = negative ? -units : units;
  const whole = absoluteUnits / minorUnitScale;
  const fraction = String(absoluteUnits % minorUnitScale).padStart(2, "0");
  const trimmedFraction = fraction.replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${
    trimmedFraction ? `.${trimmedFraction}` : ""
  }`;
}

/**
 * 以 0.01 为最小货币单位，按剩余可退金额比例分摊。
 *
 * 先向下取整，再按小数余数从大到小补齐尾差；余数相同时按明细 ID
 * 升序处理，因此同一组输入始终得到相同结果。无法保证每条分摊都大于
 * 0、退款总额超过剩余可退合计或输入不合法时返回 null。
 */
export function allocateRefundAmount(
  totalAmount: number | string,
  targets: TransactionRefundAllocationTarget[],
): TransactionRefundAllocation[] | null {
  const totalUnits = toRefundMinorUnits(totalAmount);
  if (totalUnits === null || totalUnits <= BigInt(0) || targets.length === 0) {
    return null;
  }

  const sortedTargets = [...targets].sort((left, right) =>
    compareStableText(left.id, right.id),
  );
  if (
    new Set(sortedTargets.map((target) => target.id)).size !== targets.length
  ) {
    return null;
  }

  const targetUnits = sortedTargets.map((target) => ({
    id: target.id,
    units: toRefundMinorUnits(target.remainingRefundableAmount),
  }));
  if (
    targetUnits.some(
      (target) => target.units === null || target.units <= BigInt(0),
    )
  ) {
    return null;
  }

  const normalizedTargets = targetUnits as { id: string; units: bigint }[];
  const totalRemainingUnits = normalizedTargets.reduce(
    (sum, target) => sum + target.units,
    BigInt(0),
  );
  if (totalUnits > totalRemainingUnits) return null;

  const provisional = normalizedTargets.map((target) => {
    const numerator = totalUnits * target.units;
    return {
      allocatedUnits: numerator / totalRemainingUnits,
      id: target.id,
      remainder: numerator % totalRemainingUnits,
      remainingUnits: target.units,
    };
  });
  const allocatedBaseUnits = provisional.reduce(
    (sum, target) => sum + target.allocatedUnits,
    BigInt(0),
  );
  let tailUnits = totalUnits - allocatedBaseUnits;
  const tailOrder = [...provisional].sort(
    (left, right) =>
      compareBigInt(right.remainder, left.remainder) ||
      compareStableText(left.id, right.id),
  );

  for (const target of tailOrder) {
    if (tailUnits === BigInt(0)) break;
    target.allocatedUnits += BigInt(1);
    tailUnits -= BigInt(1);
  }

  if (
    tailUnits !== BigInt(0) ||
    provisional.some(
      (target) =>
        target.allocatedUnits <= BigInt(0) ||
        target.allocatedUnits > target.remainingUnits,
    )
  ) {
    return null;
  }

  return provisional
    .sort((left, right) => compareStableText(left.id, right.id))
    .map((target) => ({
      refundAmount: Number(formatRefundMinorUnits(target.allocatedUnits)),
      refundedItemId: target.id,
    }));
}

function compareBigInt(left: bigint, right: bigint) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function compareStableText(left: string, right: string) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}
