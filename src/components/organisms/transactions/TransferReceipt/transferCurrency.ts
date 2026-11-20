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
  if (changedSide === "source") {
    const preservedTargetAmount = wasSameCurrency ? amount : targetAmount;
    const newSourceAmount = sourceCurrency === nextCurrency ? amount : "";
    return nextCurrency === targetCurrency && !!nextCurrency
      ? {
          amount: wasSameCurrency ? newSourceAmount : preservedTargetAmount,
          targetAmount: "",
        }
      : { amount: newSourceAmount, targetAmount: preservedTargetAmount };
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
    !isValidPositiveMoneyText(sourceAmount, { currency: sourceCurrency, maxDecimalPlaces: 2 }) ||
    !isValidPositiveMoneyText(targetAmount, { currency: targetCurrency, maxDecimalPlaces: 2 })
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
