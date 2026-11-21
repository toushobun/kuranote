import {
  formatMoneyTextForCurrency,
  isValidPositiveMoneyText,
} from "utils/transactionAmountInput";

export type TransferSide = "source" | "target";

export function transferAmountsAfterAccountChange({
  changedSide,
  sourceCurrency,
  targetCurrency,
  nextCurrency,
  amount,
  targetAmount,
}: {
  changedSide: TransferSide;
  sourceCurrency: string;
  targetCurrency: string;
  nextCurrency: string;
  amount: string;
  targetAmount: string;
}) {
  const wasSameCurrency = !!sourceCurrency && sourceCurrency === targetCurrency;
  // 转出账户未选时，单行金额使用转入币种；补选转出账户也应保留这笔金额。
  const amountBelongsToTarget = !sourceCurrency && !!targetCurrency;
  if (changedSide === "source") {
    const preservedTargetAmount =
      wasSameCurrency || amountBelongsToTarget ? amount : targetAmount;
    const newSourceAmount = sourceCurrency === nextCurrency ? amount : "";
    return nextCurrency === targetCurrency && !!nextCurrency
      ? {
          amount: wasSameCurrency ? newSourceAmount : preservedTargetAmount,
          targetAmount: "",
        }
      : { amount: newSourceAmount, targetAmount: preservedTargetAmount };
  }
  if (!sourceCurrency) {
    // 只选转入账户时，单行金额属于转入币种；换币种要清掉它。
    return {
      amount: targetCurrency === nextCurrency ? amount : "",
      targetAmount: "",
    };
  }
  const newTargetAmount = targetCurrency === nextCurrency ? targetAmount : "";
  return nextCurrency === sourceCurrency && !!nextCurrency
    ? { amount: amount || newTargetAmount, targetAmount: "" }
    : { amount, targetAmount: newTargetAmount };
}

/** 统一展示方向：始终把数值显示为 >= 1 的方向，保留四位有效数字。 */
export function formatTransferRate(
  sourceToTargetRate: number,
  sourceCurrency: string,
  targetCurrency: string,
) {
  if (
    !sourceCurrency ||
    !targetCurrency ||
    !Number.isFinite(sourceToTargetRate) ||
    sourceToTargetRate <= 0
  )
    return null;
  const baseIsTarget = sourceToTargetRate <= 1;
  const rate = baseIsTarget ? 1 / sourceToTargetRate : sourceToTargetRate;
  if (!Number.isFinite(rate) || rate < 1) return null;
  return {
    base: baseIsTarget ? targetCurrency : sourceCurrency,
    quote: baseIsTarget ? sourceCurrency : targetCurrency,
    value: new Intl.NumberFormat("en-US", {
      maximumSignificantDigits: 4,
      useGrouping: false,
    }).format(rate),
  };
}

export function calculateTransferRate(
  sourceAmount: string,
  targetAmount: string,
  sourceCurrency: string,
  targetCurrency: string,
) {
  if (
    !isValidPositiveMoneyText(sourceAmount, { currency: sourceCurrency }) ||
    !isValidPositiveMoneyText(targetAmount, { currency: targetCurrency })
  )
    return null;
  return formatTransferRate(
    Number(targetAmount) / Number(sourceAmount),
    sourceCurrency,
    targetCurrency,
  );
}

/** 仅在来源金额有效时预填，确保不会生成超出金额键盘允许范围的数值。 */
export function prefillTransferTargetAmount(
  sourceAmount: string,
  sourceCurrency: string,
  targetCurrency: string,
  dailyRate: number | null,
) {
  if (
    !isValidPositiveMoneyText(sourceAmount, { currency: sourceCurrency }) ||
    dailyRate === null ||
    !Number.isFinite(dailyRate) ||
    dailyRate <= 0
  )
    return "";
  const expected = Number(sourceAmount) * dailyRate;
  if (!Number.isFinite(expected) || expected <= 0) return "";
  const formatted = formatMoneyTextForCurrency(
    String(expected),
    targetCurrency,
  );
  return isValidPositiveMoneyText(formatted, { currency: targetCurrency })
    ? formatted
    : "";
}

/** 差额按未取整的理论金额计算；正数为多到账，负数为少到账。 */
export function calculateTransferDifference(
  sourceAmount: string,
  targetAmount: string,
  sourceCurrency: string,
  targetCurrency: string,
  dailyRate: number | null,
) {
  if (
    !isValidPositiveMoneyText(sourceAmount, { currency: sourceCurrency }) ||
    !isValidPositiveMoneyText(targetAmount, { currency: targetCurrency }) ||
    dailyRate === null ||
    !Number.isFinite(dailyRate) ||
    dailyRate <= 0
  )
    return null;
  const expected = Number(sourceAmount) * dailyRate;
  const diff = Number(targetAmount) - expected;
  if (!Number.isFinite(expected) || expected <= 0 || !Number.isFinite(diff))
    return null;
  return {
    diff: Math.abs(diff) < 1e-9 ? 0 : diff,
    sourceEquivalent: Math.abs(diff / dailyRate),
    percent: (Math.abs(diff) / expected) * 100,
  };
}
