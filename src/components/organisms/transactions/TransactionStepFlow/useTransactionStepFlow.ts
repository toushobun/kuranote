"use client";
import {
  useActionState,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { useTransactionForm } from "organisms/transactions/TransactionForm/useTransactionForm";
import type { TransactionFormInitialValues } from "organisms/transactions/TransactionForm/TransactionForm.types";
import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import type { ActionState } from "types/actions";
import type { TransactionAccountOption } from "types/transactions";
import type { TransactionStepFlowProps } from "./TransactionStepFlow.types";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";
export function useTransactionStepFlow(props: TransactionStepFlowProps) {
  const confirm = useConfirmDialog();
  const [saveState, saveAction, saving] = useActionState<ActionState, FormData>(
    props.action,
    {},
  );
  const pendingQuickMerchantId = useRef<string | null>(null);
  const [step, setStep] = useState(props.initialStep ?? 1);
  const [completed, setCompleted] = useState<number[]>(
    props.initialCompletedSteps ?? [],
  );
  const itemsOptions = props.itemsOptions ?? { categoryOptions: [] };
  const [amountItemId, setAmountItemId] = useState<number | null>(null);
  function automaticCategoryIds(
    quick = false,
    merchantId = props.initialMerchantId,
  ) {
    if (
      props.suggestionsMerchantId &&
      props.suggestionsMerchantId !== merchantId
    )
      return [];
    return quick || itemsOptions.prefillAutomaticItems
      ? (props.suggestions?.automaticCategoryIds ?? []).filter((id) =>
          itemsOptions.categoryOptions.some((category) => category.id === id),
        )
      : [];
  }
  const [initial] = useState(() => {
    const items = [...(itemsOptions.initialItems ?? [])];
    const automaticIds: number[] = [];
    if ((props.initialStep ?? 1) >= 3) {
      for (const categoryId of automaticCategoryIds()) {
        items.push({ categoryId, amount: "" });
        automaticIds.push(items.length);
      }
    }
    const values: TransactionFormInitialValues = {
      items,
      merchantId: props.initialMerchantId ?? "",
      note: "",
      payments: itemsOptions.initialPayments ?? [
        { accountId: props.initialAccountId ?? "", amount: null },
      ],
      transactionAt: "",
      type: "expense",
    };
    return { values, automaticIds };
  });
  const [automaticItemIds, setAutomaticItemIds] = useState(
    initial.automaticIds,
  );
  const [automaticItemsInitialized, setAutomaticItemsInitialized] = useState(
    (props.initialStep ?? 1) >= 3,
  );
  const form = useTransactionForm({
    accountOptions: props.accounts,
    categoryOptions: itemsOptions.categoryOptions,
    merchantOptions: props.merchants,
    initialValues: initial.values,
    deferPickerAmount: true,
    onPickerItemCommit: setAmountItemId,
  });
  const [returning, setReturning] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const merchant = props.merchants.find(
    (item) => item.id === form.selectedMerchantId,
  );
  const account = form.selectedAccount;
  function initializeAutomaticItems(quick = false) {
    if (automaticItemsInitialized || form.itemSummaries.length > 0) return [];
    const ids = automaticCategoryIds(quick, form.selectedMerchantId).map(
      (categoryId) => form.addItem(categoryId, "", null, null, null),
    );
    setAutomaticItemIds(ids);
    setAutomaticItemsInitialized(true);
    return ids;
  }
  const suggestionsReady =
    !!merchant &&
    props.suggestionsMerchantId === merchant.id &&
    !!props.suggestions;
  const applySuggestions = useEffectEvent(() => {
    if (!suggestionsReady || pendingQuickMerchantId.current !== merchant?.id)
      return;
    pendingQuickMerchantId.current = null;
    if (form.itemSummaries.length > 0) return;
    const recommended = props.accounts.find(
      (account) => account.id === props.suggestions?.recommendedAccountIds[0],
    );
    if (recommended) {
      const primary = form.payments[0];
      if (primary) form.handlePaymentAccountChange(primary.key, recommended.id);
      props.onAccountSelect(recommended);
    }
    const ids = initializeAutomaticItems(true);
    setCompleted(ids.length ? [1, 2, 3] : recommended ? [1, 2] : [1]);
    setStep(ids.length ? 4 : recommended ? 3 : 2);
    setAmountItemId(ids[0] ?? null);
  });
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 按商家标识同步异步到达的建议，pending 标识保证只应用一次。
    applySuggestions();
  }, [suggestionsReady, props.suggestions, merchant?.id]);
  function goToStep(target: number) {
    pendingQuickMerchantId.current = null;
    if (target === 3) initializeAutomaticItems();
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
    pendingQuickMerchantId.current =
      !returning && step !== 4 && !form.itemSummaries.length ? value.id : null;
    form.handleMerchantChange(value.id);
    props.onMerchantSelect(value);
    setCompleted((current) =>
      current.includes(1) ? current : [...current, 1],
    );
    setStep(2);
  }
  function selectAccount(value: TransactionAccountOption) {
    pendingQuickMerchantId.current = null;
    const primary = form.payments[0];
    if (primary) form.handlePaymentAccountChange(primary.key, value.id);
    props.onAccountSelect(value);
    if (!returning) advance(2);
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
    saveState,
    saveAction,
    saving,
    suggestions:
      !props.suggestionsMerchantId || suggestionsReady
        ? props.suggestions
        : undefined,
    merchantHasHistory:
      props.suggestions && (!props.suggestionsMerchantId || suggestionsReady)
        ? !!(
            props.suggestions.recommendedAccountIds.length ||
            props.suggestions.quickAmounts.length
          )
        : undefined,
    form,
    itemsOptions,
    automaticItemIds,
    amountItemId,
    setAmountItemId,
    completed,
    returning,
    methodOpen,
    setMethodOpen,
    merchant,
    account,
    goToStep,
    advance,
    selectMerchant,
    selectAccount,
    requestClose,
  };
}
