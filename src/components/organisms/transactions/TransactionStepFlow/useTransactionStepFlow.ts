"use client";
import {
  useActionState,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { useResolvedTransactionIncomeLinks } from "organisms/transactions/TransactionForm/TransactionIncomeLinksContext";
import { useTransactionForm } from "organisms/transactions/TransactionForm/useTransactionForm";
import type { TransactionFormInitialValues } from "organisms/transactions/TransactionForm/TransactionForm.types";
import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import type { ActionState } from "types/actions";
import type { TransactionAccountOption } from "types/transactions";
import type { TransactionStepFlowProps } from "./TransactionStepFlow.types";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";

// 快速路线：选完商家后最多等待建议数据这么久，超时则进入账户步骤。
export const quickRouteSuggestionTimeoutMs = 2000;

export function useTransactionStepFlow(props: TransactionStepFlowProps) {
  const confirm = useConfirmDialog();
  const [saveState, saveAction, saving] = useActionState<ActionState, FormData>(
    props.action,
    {},
  );
  const pendingQuickMerchantId = useRef<string | null>(null);
  // 快速路线等待建议数据期间停在商家步骤，被点中的商家显示加载状态。
  const [loadingMerchantId, setLoadingMerchantId] = useState<string | null>(
    null,
  );
  const [step, setStep] = useState(props.initialStep ?? 1);
  const [itemsReached, setItemsReached] = useState(
    (props.initialStep ?? 1) >= 3,
  );
  const baseItemsOptions = props.itemsOptions ?? { categoryOptions: [] };
  // 明细抽屉的退款 / 报销选择器优先使用页面的 TransactionIncomeLinksProvider。
  const itemsOptions = {
    ...baseItemsOptions,
    ...useResolvedTransactionIncomeLinks(baseItemsOptions),
  };
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
  const completed = [
    ...(merchant ? [1] : []),
    ...(account ? [2] : []),
    ...(form.hasValidItems && !form.accountFieldError ? [3] : []),
  ];
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
    setLoadingMerchantId(null);
    if (form.itemSummaries.length > 0) {
      setStep(2);
      return;
    }
    const recommended = props.accounts.find(
      (account) => account.id === props.suggestions?.recommendedAccountIds[0],
    );
    if (recommended) {
      const primary = form.payments[0];
      if (primary) form.handlePaymentAccountChange(primary.key, recommended.id);
      props.onAccountSelect(recommended);
    }
    const ids = initializeAutomaticItems(true);
    if (ids.length || recommended) setItemsReached(true);
    setStep(ids.length ? 4 : recommended ? 3 : 2);
  });
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 按商家标识同步异步到达的建议，pending 标识保证只应用一次。
    applySuggestions();
  }, [suggestionsReady, props.suggestions, merchant?.id, loadingMerchantId]);
  useEffect(() => {
    if (!loadingMerchantId) return;
    // 获取失败按「没有建议」处理会直接到达；一直没有结果时也不阻断手动记账。
    const timer = setTimeout(() => {
      pendingQuickMerchantId.current = null;
      setLoadingMerchantId(null);
      setStep(2);
    }, quickRouteSuggestionTimeoutMs);
    return () => clearTimeout(timer);
  }, [loadingMerchantId]);
  function goToStep(target: number) {
    pendingQuickMerchantId.current = null;
    setLoadingMerchantId(null);
    if (target === 3) {
      setItemsReached(true);
      initializeAutomaticItems();
    }
    if (step === 4 && target !== 4) setReturning(true);
    if (target === 4) setReturning(false);
    setStep(target);
  }
  function advance(from: number) {
    goToStep(returning ? 4 : from + 1);
  }
  function selectMerchant(value: FlowMerchant) {
    // 从确认页回来换商家或已有明细时不走快速路线，直接进入账户步骤。
    const quick = !returning && step !== 4 && !form.itemSummaries.length;
    pendingQuickMerchantId.current = quick ? value.id : null;
    form.handleMerchantChange(value.id);
    props.onMerchantSelect(value);
    if (quick) setLoadingMerchantId(value.id);
    else setStep(2);
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
    clickableSteps: [...completed, ...(itemsReached ? [3] : []), 4],
    returning,
    methodOpen,
    setMethodOpen,
    merchant,
    account,
    stepDetails: [
      merchant?.name,
      account &&
        (form.payments.length > 1
          ? m.multipleAccounts(account.name, form.payments.length)
          : account.name),
    ],
    loadingMerchantId,
    goToStep,
    advance,
    selectMerchant,
    selectAccount,
    requestClose,
  };
}
