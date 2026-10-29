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
import type { TransactionStepFlowProps } from "./TransactionStepFlow.types";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";

// 快速路线：选完商家后最多等待建议数据这么久，超时则不再应用建议，直接进入小票。
export const quickRouteSuggestionTimeoutMs = 2000;

export type TransactionStepFlowScreen = "merchant" | "receipt";

export function useTransactionStepFlow(props: TransactionStepFlowProps) {
  const confirm = useConfirmDialog();
  const [saveState, saveAction, saving] = useActionState<ActionState, FormData>(
    props.action,
    {},
  );
  // 等待建议数据的商家；只应用一次，超时、返回换商家或已有输入时清空。
  const pendingQuickMerchantId = useRef<string | null>(
    props.initialMerchantId ?? null,
  );
  // 快速路线等待建议数据期间停在选择商家，被点中的商家显示加载状态。
  const [loadingMerchantId, setLoadingMerchantId] = useState<string | null>(
    null,
  );
  // 带商家进入时同样等待建议，但已经停在小票，不显示商家的加载状态。
  const [waitingInitialSuggestions, setWaitingInitialSuggestions] = useState(
    !!props.initialMerchantId,
  );
  const [screen, setScreen] = useState<TransactionStepFlowScreen>(
    props.initialMerchantId ? "receipt" : "merchant",
  );
  const [receiptVisited, setReceiptVisited] = useState(
    !!props.initialMerchantId,
  );
  const baseItemsOptions = props.itemsOptions ?? { categoryOptions: [] };
  // 明细抽屉的退款 / 报销选择器优先使用页面的 TransactionIncomeLinksProvider。
  const itemsOptions = {
    ...baseItemsOptions,
    ...useResolvedTransactionIncomeLinks(baseItemsOptions),
  };
  const [amountItemId, setAmountItemId] = useState<number | null>(null);
  const [initialValues] = useState<TransactionFormInitialValues>(() => ({
    items: itemsOptions.initialItems ?? [],
    merchantId: props.initialMerchantId ?? "",
    note: "",
    payments: itemsOptions.initialPayments ?? [
      { accountId: props.initialAccountId ?? "", amount: null },
    ],
    transactionAt: "",
    type: "expense",
  }));
  const [automaticItemIds, setAutomaticItemIds] = useState<number[]>([]);
  const form = useTransactionForm({
    accountOptions: props.accounts,
    categoryOptions: itemsOptions.categoryOptions,
    merchantOptions: props.merchants,
    initialValues,
    deferPickerAmount: true,
    onPickerItemCommit: setAmountItemId,
  });
  const [methodOpen, setMethodOpen] = useState(false);
  const merchant = props.merchants.find(
    (item) => item.id === form.selectedMerchantId,
  );
  const suggestionsReady =
    !!merchant &&
    props.suggestionsMerchantId === merchant.id &&
    !!props.suggestions;
  function stopWaiting() {
    pendingQuickMerchantId.current = null;
    setLoadingMerchantId(null);
    setWaitingInitialSuggestions(false);
  }
  function showReceipt() {
    setScreen("receipt");
    setReceiptVisited(true);
  }
  const applySuggestions = useEffectEvent(() => {
    if (!suggestionsReady || pendingQuickMerchantId.current !== merchant?.id)
      return;
    stopWaiting();
    showReceipt();
    // 已有明细时不覆盖用户输入。
    if (form.itemSummaries.length > 0) return;
    const recommended = props.accounts.find(
      (account) => account.id === props.suggestions?.recommendedAccountIds[0],
    );
    const primary = form.payments[0];
    if (recommended && primary && !primary.accountId) {
      form.handlePaymentAccountChange(primary.key, recommended.id);
      props.onAccountSelect(recommended);
    }
    setAutomaticItemIds(
      (props.suggestions?.automaticCategoryIds ?? [])
        .filter((id) =>
          itemsOptions.categoryOptions.some((category) => category.id === id),
        )
        .map((categoryId) => form.addItem(categoryId, "", null, null, null)),
    );
  });
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 按商家标识同步异步到达的建议，pending 标识保证只应用一次。
    applySuggestions();
  }, [suggestionsReady, props.suggestions, merchant?.id, loadingMerchantId]);
  const waiting = !!loadingMerchantId || waitingInitialSuggestions;
  useEffect(() => {
    if (!waiting) return;
    // 获取失败按「没有建议」处理会直接到达；一直没有结果时也不阻断手动记账。
    const timer = setTimeout(() => {
      stopWaiting();
      showReceipt();
    }, quickRouteSuggestionTimeoutMs);
    return () => clearTimeout(timer);
  }, [waiting]);
  function backToMerchant() {
    stopWaiting();
    setAmountItemId(null);
    setScreen("merchant");
  }
  function selectMerchant(value: FlowMerchant) {
    // 从小票返回换商家或已有明细时不走快速路线，直接回到小票。
    const quick = !receiptVisited && !form.itemSummaries.length;
    pendingQuickMerchantId.current = quick ? value.id : null;
    form.handleMerchantChange(value.id);
    props.onMerchantSelect(value);
    if (quick) setLoadingMerchantId(value.id);
    else showReceipt();
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
    screen,
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
    methodOpen,
    setMethodOpen,
    loadingMerchantId,
    backToMerchant,
    selectMerchant,
    requestClose,
  };
}
