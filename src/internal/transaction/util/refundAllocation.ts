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
 * 将金额转换为以 0.01 为单位的整数。
 * 不经过浮点运算，直接解析输入字符串的小数位。
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

/** 将以 0.01 为单位的整数转换为金额字符串，并移除末尾多余的 0。 */
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

export function isRefundAllocationTotalWithinAmount(
  totalAmount: number | string,
  allocations: readonly Pick<TransactionRefundAllocation, "refundAmount">[],
) {
  const totalUnits = toRefundMinorUnits(totalAmount);
  if (totalUnits === null) return false;

  let allocationTotalUnits = BigInt(0);
  for (const allocation of allocations) {
    const allocationUnits = toRefundMinorUnits(allocation.refundAmount);
    if (allocationUnits === null || allocationUnits <= BigInt(0)) return false;
    allocationTotalUnits += allocationUnits;
  }

  return allocationTotalUnits <= totalUnits;
}

/**
 * 以 0.01 为最小货币单位，按剩余可退金额比例分摊。
 *
 * 先向下取整，再按小数余数从大到小补齐尾差；余数相同时按明细 ID
 * 升序处理，因此同一组输入始终得到相同结果。无法保证每条分摊都大于
 * 0 或输入不合法时返回 null。退款总额超过剩余可退合计时，仅分摊可退合计，
 * 超出部分保留为退款收入的净收益。
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
  const allocatableUnits =
    totalUnits < totalRemainingUnits ? totalUnits : totalRemainingUnits;

  const provisional = normalizedTargets.map((target) => {
    const numerator = allocatableUnits * target.units;
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
  let tailUnits = allocatableUnits - allocatedBaseUnits;
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
