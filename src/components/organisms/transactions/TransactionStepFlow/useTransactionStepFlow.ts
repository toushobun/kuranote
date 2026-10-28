"use client";
import { merchantEntryDisplayLimits } from "internal/transaction";
import { useState } from "react";
import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import type { TransactionAccountOption } from "types/transactions";
import type {
  FlowMerchant,
  TransactionStepFlowProps,
} from "./TransactionStepFlow.types";
import { flowMessages as m } from "./transactionStepFlowMessages";
export function useTransactionStepFlow(props: TransactionStepFlowProps) {
  const confirm = useConfirmDialog();
  const [step, setStep] = useState(props.initialStep ?? 1);
  const [completed, setCompleted] = useState<number[]>(
    props.initialCompletedSteps ?? [],
  );
  const [returning, setReturning] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const [merchantId, setMerchantId] = useState(props.initialMerchantId);
  const [accountId, setAccountId] = useState(props.initialAccountId);
  const [search, setSearch] = useState("");
  const [tagId, setTagId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const keyword = search.trim();
  const merchant = props.merchants.find((item) => item.id === merchantId);
  const account = props.accounts.find((item) => item.id === accountId);
  const filtered = props.merchants.filter(
    (item) =>
      (!tagId || item.tags.some((tag) => tag.id === tagId)) &&
      item.name.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()),
  );
  const frequent = props.frequentMerchants
    .slice(0, merchantEntryDisplayLimits.frequentMerchants)
    .flatMap((item) =>
      props.merchants.filter((merchant) => merchant.id === item.merchantId),
    );
  const recommended = (props.suggestions?.recommendedAccountIds ?? [])
    .slice(0, merchantEntryDisplayLimits.recommendedAccounts)
    .flatMap((id) => props.accounts.filter((account) => account.id === id));
  const others = props.accounts.filter(
    (account) => !recommended.some((item) => item.id === account.id),
  );
  function goToStep(target: number) {
    if (step === 4 && target !== 4) setReturning(true);
    if (target === 4) setReturning(false);
    setStep(target);
  }
  function advance(from: number) {
    setCompleted((current) =>
      current.includes(from) ? current : [...current, from],
    );
    goToStep(returning ? 4 : from + 1);
  }
  function selectMerchant(value: FlowMerchant) {
    setMerchantId(value.id);
    props.onMerchantSelect(value);
    setCompleted((current) =>
      current.includes(1) ? current : [...current, 1],
    );
    setStep(2);
  }
  async function selectAccount(value: TransactionAccountOption) {
    if (busy) return;
    setBusy(true);
    try {
      if (
        props.hasDetails &&
        account &&
        account.currency !== value.currency &&
        !(await confirm({
          title: m.currencyTitle(value.name),
          description: m.currencyDescription(account.currency, value.currency),
          cancelLabel: m.cancel,
          confirmLabel: m.switch,
        }))
      )
        return;
      setAccountId(value.id);
      props.onAccountSelect(value);
      if (!returning) advance(2);
    } finally {
      setBusy(false);
    }
  }
  async function requestClose() {
    if (
      await confirm({
        title: m.abandonTitle,
        description: m.abandonDescription,
        cancelLabel: m.continue,
        confirmLabel: m.abandon,
      })
    )
      props.onClose();
  }
  return {
    step,
    completed,
    returning,
    methodOpen,
    setMethodOpen,
    merchant,
    account,
    search,
    setSearch,
    keyword,
    tagId,
    setTagId,
    filtered,
    frequent,
    recommended,
    others,
    busy,
    goToStep,
    advance,
    selectMerchant,
    selectAccount,
    requestClose,
  };
}
