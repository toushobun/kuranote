import {
  formatRefundMinorUnits,
  summarizeRefundAllocationAmounts,
  toRefundMinorUnits,
} from "internal/transaction";
import {
  formatTransferRate,
  prefillTransferTargetAmount,
} from "../TransferReceipt/transferCurrency";

export type LinkExchangeRate = {
  rate: number;
  rateDate: string;
};

/**
 * 仅供尚未保存的表单预览：转换两端货币，再复用既有单目标核销摘要。
 * 已保存明细的实际抵扣金额必须从 SQL transaction_link_allocations 取得。
 */
export function previewCrossCurrencyLink({
  amount,
  incomeCurrency,
  targetCurrency,
  remainingAmount,
  rate,
}: {
  amount: string;
  incomeCurrency: string;
  targetCurrency: string;
  remainingAmount: string;
  rate: number;
}) {
  if (!Number.isFinite(rate) || rate <= 0) return null;
  const convertedAmount =
    amount === "0"
      ? "0"
      : prefillTransferTargetAmount(
          amount,
          incomeCurrency,
          targetCurrency,
          rate,
        );
  if (!convertedAmount) return null;

  const allocation = summarizeRefundAllocationAmounts(
    convertedAmount,
    remainingAmount,
  );
  const convertedUnits = toRefundMinorUnits(convertedAmount);
  const surplusTargetUnits = allocation
    ? toRefundMinorUnits(allocation.netIncomeAmount)
    : null;
  const incomeUnits = toRefundMinorUnits(amount);
  if (
    !allocation ||
    convertedUnits === null ||
    surplusTargetUnits === null ||
    incomeUnits === null
  )
    return null;
  const actualTargetUnits = convertedUnits - surplusTargetUnits;
  const actualTargetAmount = formatRefundMinorUnits(actualTargetUnits);
  const foldedBackAmount =
    actualTargetUnits === BigInt(0)
      ? "0"
      : prefillTransferTargetAmount(
          actualTargetAmount,
          targetCurrency,
          incomeCurrency,
          1 / rate,
        );
  const foldedUnits = foldedBackAmount
    ? toRefundMinorUnits(foldedBackAmount)
    : null;
  if (foldedUnits === null) return null;
  return {
    convertedAmount,
    actualTargetAmount,
    foldedBackAmount,
    businessNetAmount: formatRefundMinorUnits(
      incomeUnits > foldedUnits ? incomeUnits - foldedUnits : BigInt(0),
    ),
  };
}

export function formatCrossCurrencyRate(
  rate: number,
  incomeCurrency: string,
  targetCurrency: string,
  rateDate: string,
) {
  const value = formatTransferRate(rate, incomeCurrency, targetCurrency);
  if (!value) return null;
  const [, month, day] = rateDate.split("-");
  return {
    ...value,
    date: `${Number(month)}/${Number(day)}`,
  };
}
