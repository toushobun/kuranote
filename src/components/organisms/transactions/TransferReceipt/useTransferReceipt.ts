"use client";
import { useEffect, useState, type ChangeEvent } from "react";

import {
  flowMessages as m,
  transferReceiptMessages as t,
} from "config/transactionStepFlowMessages";
import { fetchClientJson } from "lib/api/clientQuery";
import { useDirtySnapshot } from "molecules/ui/UnsavedChangesDialog/useDirtySnapshot";
import type { ReceiptIssue } from "organisms/transactions/ReceiptParts/ReceiptIssueAlerts";
import { useLocalTransactionDateTime } from "organisms/transactions/ReceiptParts/useLocalTransactionDateTime";
import { useReceiptIssueCheck } from "organisms/transactions/ReceiptParts/useReceiptIssueCheck";
import type {
  TransactionAccountOption,
  TransferEditInitialValues,
} from "types/transactions";
import { isValidPositiveMoneyText } from "utils/transactionAmountInput";

import { useEditTransactionDirty } from "../EditTransactionDirtyContext/EditTransactionDirtyContext";
import {
  calculateTransferDifference,
  calculateTransferRate,
  formatTransferRate,
  prefillTransferTargetAmount,
  transferAmountsAfterAccountChange,
} from "./transferCurrency";

export type TransferSide = "source" | "target";

export type DailyTransferRate = {
  rate: number | null;
  rateDate: string | null;
};
export type LoadDailyTransferRate = (
  query: { from: string; to: string; date: string },
  signal: AbortSignal,
) => Promise<DailyTransferRate | null>;

const fetchDailyTransferRate: LoadDailyTransferRate = (query, signal) => {
  const params = new URLSearchParams(query);
  return fetchClientJson<DailyTransferRate>(
    "/api/exchange-rates/daily?" + params.toString(),
    signal,
  );
};

/** 表单本地时间对应的东京日历日，和数据库交易日期口径一致。 */
function transactionDateInTokyo(value: string) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Tokyo",
    year: "numeric",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  return [part("year"), part("month"), part("day")].join("-");
}

export function useTransferReceipt({
  accountOptions,
  initialValues,
  readOnly,
  loadDailyRate = fetchDailyTransferRate,
}: {
  accountOptions: readonly TransactionAccountOption[];
  initialValues?: TransferEditInitialValues;
  readOnly: boolean;
  loadDailyRate?: LoadDailyTransferRate;
}) {
  const [sourceId, setSourceId] = useState(initialValues?.accountId ?? "");
  const [targetId, setTargetId] = useState(
    initialValues?.transferTargetAccountId ?? "",
  );
  const [amount, setAmount] = useState(initialValues?.transferAmount ?? "");
  const [transferTargetAmount, setTransferTargetAmount] = useState(() => {
    const sourceCurrency = accountOptions.find(
      (account) => account.id === initialValues?.accountId,
    )?.currency;
    const targetCurrency = accountOptions.find(
      (account) => account.id === initialValues?.transferTargetAccountId,
    )?.currency;
    // 同币种不展示第二笔金额，也不能让隐藏的初始值触发误报未保存。
    return sourceCurrency && targetCurrency && sourceCurrency !== targetCurrency
      ? (initialValues?.transferTargetAmount ?? "")
      : "";
  });
  const [targetAmountEdited, setTargetAmountEdited] = useState(
    Boolean(initialValues),
  );
  const [rateState, setRateState] = useState<{
    key: string;
    value: DailyTransferRate | null;
  } | null>(null);
  const [note, setNote] = useState(initialValues?.note ?? "");
  const [picker, setPicker] = useState<TransferSide | null>(null);
  const [amountSide, setAmountSide] = useState<TransferSide | null>(null);
  const [timeOpen, setTimeOpen] = useState(false);
  const dateTime = useLocalTransactionDateTime(initialValues?.transactionAt);

  useDirtySnapshot(
    JSON.stringify([
      sourceId,
      targetId,
      amount,
      transferTargetAmount,
      note,
      dateTime.transactionAtValue,
    ]),
    useEditTransactionDirty(),
    Boolean(dateTime.transactionAtValue),
  );

  const source = accountOptions.find((account) => account.id === sourceId);
  const target = accountOptions.find((account) => account.id === targetId);
  const currency = source?.currency ?? target?.currency ?? "";
  const targetCurrency = target?.currency ?? "";
  const crossCurrency =
    !!source && !!target && source.currency !== target.currency;
  const tokyoDate = transactionDateInTokyo(dateTime.transactionAtValue);
  const queryKey =
    crossCurrency && tokyoDate
      ? [currency, targetCurrency, tokyoDate].join("|")
      : "";
  useEffect(() => {
    if (!queryKey) return;
    const controller = new AbortController();
    const [from, to, date] = queryKey.split("|");
    void loadDailyRate({ from, to, date }, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) {
          setRateState({ key: queryKey, value });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setRateState({ key: queryKey, value: null });
        }
      });
    return () => controller.abort();
  }, [queryKey, loadDailyRate]);

  const rateLoading = Boolean(queryKey && rateState?.key !== queryKey);
  const response =
    queryKey && rateState?.key === queryKey ? rateState.value : null;
  const referenceRate =
    response?.rate &&
    Number.isFinite(response.rate) &&
    response.rate > 0 &&
    response.rateDate
      ? { rate: response.rate, rateDate: response.rateDate }
      : null;
  // 自动金额只作为派生值参与显示、校验和保存，不进入未保存判断的快照。
  const effectiveTargetAmount = targetAmountEdited
    ? transferTargetAmount
    : prefillTransferTargetAmount(
        amount,
        currency,
        targetCurrency,
        referenceRate?.rate ?? null,
      );
  const rate = crossCurrency
    ? calculateTransferRate(
        amount,
        effectiveTargetAmount,
        currency,
        targetCurrency,
      )
    : null;
  const dailyRate = referenceRate
    ? formatTransferRate(referenceRate.rate, currency, targetCurrency)
    : null;
  const difference = targetAmountEdited
    ? calculateTransferDifference(
        amount,
        effectiveTargetAmount,
        currency,
        targetCurrency,
        referenceRate?.rate ?? null,
      )
    : null;
  const pickerAccounts = accountOptions.filter(
    (account) => account.id !== (picker === "source" ? targetId : sourceId),
  );

  const issues: ReceiptIssue[] = [
    ...(!source
      ? [
          {
            id: "source",
            message: t.missingSource,
            onClick: () => setPicker("source"),
          },
        ]
      : []),
    ...(!target
      ? [
          {
            id: "target",
            message: t.missingTarget,
            onClick: () => setPicker("target"),
          },
        ]
      : []),
    ...(!isValidPositiveMoneyText(amount, { currency })
      ? [
          {
            id: "amount",
            message: amount.trim()
              ? crossCurrency
                ? t.invalidSourceAmount
                : t.invalidAmount
              : crossCurrency
                ? t.missingSourceAmount
                : t.missingAmount,
            onClick: () => setAmountSide("source"),
          },
        ]
      : []),
    ...(crossCurrency &&
    !isValidPositiveMoneyText(effectiveTargetAmount, {
      currency: targetCurrency,
    })
      ? [
          {
            id: "targetAmount",
            message: effectiveTargetAmount.trim()
              ? t.invalidTargetAmount
              : t.missingTargetAmount,
            onClick: () => setAmountSide("target"),
          },
        ]
      : []),
    ...(!dateTime.transactionAtValue
      ? [
          {
            id: "time",
            message: m.invalidTime,
            onClick: () => setTimeOpen(true),
          },
        ]
      : []),
  ];
  const issueCheck = useReceiptIssueCheck(issues.map((issue) => issue.id));
  const visibleIssues = issues.filter((issue) =>
    issueCheck.isChecked(issue.id),
  );
  const isMarked = (id: string) =>
    visibleIssues.some((issue) => issue.id === id);

  return {
    source,
    target,
    sourceId,
    targetId,
    currency,
    targetCurrency,
    crossCurrency,
    amount,
    transferTargetAmount: effectiveTargetAmount,
    rate,
    dailyRate,
    dailyRateDate: referenceRate?.rateDate ?? null,
    rateLoading,
    targetAmountEdited,
    difference,
    restoreDailyRate() {
      setTargetAmountEdited(false);
      setTransferTargetAmount("");
    },
    note,
    dateTime,
    picker,
    setPicker,
    pickerAccounts,
    pickerSelectedAccount: picker === "source" ? source : target,
    selectAccount(account: TransactionAccountOption) {
      if (!picker) return;
      const next = transferAmountsAfterAccountChange({
        changedSide: picker,
        sourceCurrency: source?.currency ?? "",
        targetCurrency: target?.currency ?? "",
        nextCurrency: account.currency,
        amount,
        targetAmount: effectiveTargetAmount,
      });
      setAmount(next.amount);
      setTransferTargetAmount(next.targetAmount);
      const nextSourceCurrency =
        picker === "source" ? account.currency : source?.currency;
      const nextTargetCurrency =
        picker === "target" ? account.currency : target?.currency;
      const nextCrossCurrency = Boolean(
        nextSourceCurrency &&
        nextTargetCurrency &&
        nextSourceCurrency !== nextTargetCurrency,
      );
      // 换币种后沿用原金额保留规则：新转入币种重算，转出金额丢失时
      // 则保留原到账金额，作为独立填写值。
      setTargetAmountEdited(
        Boolean(nextCrossCurrency && next.targetAmount) &&
          (targetAmountEdited || (picker === "source" && !next.amount)),
      );
      if (picker === "source") setSourceId(account.id);
      else setTargetId(account.id);
      setPicker(null);
    },
    amountSide,
    setAmountSide,
    confirmAmount(value: string) {
      if (amountSide === "target") {
        setTransferTargetAmount(value);
        setTargetAmountEdited(true);
      } else setAmount(value);
      setAmountSide(null);
    },
    timeOpen,
    setTimeOpen,
    handleNoteChange(
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) {
      setNote(event.target.value);
    },
    visibleIssues,
    isMarked,
    pulseCount: issueCheck.pulseCount,
    firstIssueRef: issueCheck.firstIssueRef,
    checkIssues() {
      const hasIssues = issues.length > 0;
      issueCheck.check(hasIssues && !readOnly);
      return hasIssues;
    },
  };
}
