import { isValidPositiveMoneyText } from "utils/transactionAmountInput";

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

export function calculateTransferRate(
  sourceAmount: string,
  targetAmount: string,
  sourceCurrency: string,
  targetCurrency: string,
) {
  if (
    !sourceCurrency ||
    !targetCurrency ||
    !isValidPositiveMoneyText(sourceAmount, {
      currency: sourceCurrency,
      maxDecimalPlaces: 2,
    }) ||
    !isValidPositiveMoneyText(targetAmount, {
      currency: targetCurrency,
      maxDecimalPlaces: 2,
    })
  )
    return null;
  const source = Number(sourceAmount);
  const target = Number(targetAmount);
  const sourcePerTarget = source / target;
  const baseIsTarget = sourcePerTarget >= 1;
  const rate = baseIsTarget ? sourcePerTarget : target / source;
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
