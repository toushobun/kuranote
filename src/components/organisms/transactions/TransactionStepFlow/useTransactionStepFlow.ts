"use client";
import {
  useActionState,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { useTransactionReceiptForm } from "organisms/transactions/TransactionConfirmStep/useTransactionReceiptForm";
import type { TransactionFormInitialValues } from "organisms/transactions/TransactionForm/TransactionForm.types";
import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import type { ActionState } from "types/actions";
import type { TransactionStepFlowProps } from "./TransactionStepFlow.types";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";

// 快速路线：选完商家后最多等待建议数据这么久，超时则直接进入小票；
// 之后晚到的建议只在用户还没动过小票时补上。
export const quickRouteSuggestionTimeoutMs = 2000;

export type TransactionStepFlowScreen = "merchant" | "receipt";

// 自动添加的明细及当时的分类，用于判断换商家时是否还没动过。
type AutomaticItem = { id: number; categoryId: string };

export function useTransactionStepFlow(props: TransactionStepFlowProps) {
  const confirm = useConfirmDialog();
  const [saveState, saveAction, saving] = useActionState<ActionState, FormData>(
    props.action,
    {},
  );
  // 等待建议数据的商家；只应用一次，超时后动过小票或已有输入时清空。
  const pendingQuickMerchantId = useRef<string | null>(
    props.initialMerchantId ?? null,
  );
  // 从小票换商家：建议到达时替换上一个商家没动过的自动明细，而不是跳过。
  const replacingAutomaticItems = useRef(false);
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
  const [initialValues] = useState<TransactionFormInitialValues>(() => ({
    items: baseItemsOptions.initialItems ?? [],
    merchantId: props.initialMerchantId ?? "",
    note: "",
    payments: baseItemsOptions.initialPayments ?? [
      { accountId: props.initialAccountId ?? "", amount: null },
    ],
    transactionAt: "",
    type: "expense",
  }));
  const [automaticItems, setAutomaticItems] = useState<AutomaticItem[]>([]);
  const { form, itemsOptions, amountItemId, setAmountItemId } =
    useTransactionReceiptForm({
      accounts: props.accounts,
      merchants: props.merchants,
      itemsOptions: baseItemsOptions,
      initialValues,
    });
  // 开始等待建议时的小票；之后与之不同即视为用户动过小票
  //（选账户、加 / 删明细、改分类 / 金额 / 特殊状态 / 关联、改备注 / 时间）。
  const receiptSnapshot = JSON.stringify([
    form.itemSummaries.map((item) => [
      item.id,
      item.categoryId,
      item.amount,
      item.specialStatus,
      item.refundCandidate,
      item.reimbursementCandidate,
    ]),
    form.payments.map((payment) => [payment.accountId, payment.amount]),
    form.note,
    form.transactionAtValue,
  ]);
  const waitStartSnapshot = useRef(receiptSnapshot);
  const timeInitialized = !!form.transactionAtValue;
  const resetWaitStartSnapshot = useEffectEvent(() => {
    waitStartSnapshot.current = receiptSnapshot;
  });
  useEffect(() => {
    // 挂载后才填入本地当前时间，不算用户动过小票。
    if (timeInitialized) resetWaitStartSnapshot();
  }, [timeInitialized]);
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
    const replacing = replacingAutomaticItems.current;
    replacingAutomaticItems.current = false;
    stopWaiting();
    showReceipt();
    // 已有明细时不覆盖用户输入（换商家时只替换没动过的自动明细）。
    if (!replacing && form.itemSummaries.length > 0) return;
    const recommended = props.accounts.find(
      (account) => account.id === props.suggestions?.recommendedAccountIds[0],
    );
    const primary = form.payments[0];
    if (recommended && primary && !primary.accountId) {
      form.handlePaymentAccountChange(primary.key, recommended.id);
      props.onAccountSelect(recommended);
    }
    const categoryIds = (props.suggestions?.automaticCategoryIds ?? []).filter(
      (id) =>
        itemsOptions.categoryOptions.some((category) => category.id === id),
    );
    // 上一个商家自动添加且没动过的明细：新商家也常用该分类则留作自动明细，否则去掉。
    const untouched = automaticItems.filter((automatic) =>
      form.itemSummaries.some(
        (item) =>
          item.id === automatic.id &&
          item.categoryId === automatic.categoryId &&
          !item.amount.trim() &&
          !item.specialStatus &&
          !item.refundCandidate &&
          !item.reimbursementCandidate,
      ),
    );
    const kept = untouched.filter((item) =>
      categoryIds.includes(item.categoryId),
    );
    const removedIds = untouched
      .filter((item) => !kept.includes(item))
      .map((item) => item.id);
    removedIds.forEach((id) => form.removeItem(id));
    const remainingCategoryIds = new Set(
      form.itemSummaries
        .filter((item) => !removedIds.includes(item.id))
        .map((item) => item.categoryId),
    );
    setAutomaticItems([
      ...kept,
      // 已有同一分类的明细时不重复追加。
      ...categoryIds
        .filter((categoryId) => !remainingCategoryIds.has(categoryId))
        .map((categoryId) => ({
          id: form.addItem(categoryId, "", null, null, null),
          categoryId,
        })),
    ]);
  });
  useEffect(() => {
    // 按商家标识同步异步到达的建议，pending 标识保证只应用一次。
    applySuggestions();
  }, [suggestionsReady, props.suggestions, merchant?.id, loadingMerchantId]);
  const waiting = !!loadingMerchantId || waitingInitialSuggestions;
  useEffect(() => {
    if (!waiting) return;
    // 获取失败按「没有建议」处理会直接到达；一直没有结果时也不阻断手动记账。
    // 加载中改点另一个商家时重新计时。
    // 超时后保留等待中的商家，晚到的建议在用户动过小票之前仍可补上。
    const timer = setTimeout(() => {
      setLoadingMerchantId(null);
      setWaitingInitialSuggestions(false);
      showReceipt();
    }, quickRouteSuggestionTimeoutMs);
    return () => clearTimeout(timer);
  }, [waiting, loadingMerchantId]);
  useEffect(() => {
    // 超时后或换商家后动过小票就丢弃晚到的建议，不覆盖用户输入。
    if (!waiting && receiptSnapshot !== waitStartSnapshot.current)
      pendingQuickMerchantId.current = null;
  }, [waiting, receiptSnapshot]);
  function backToMerchant() {
    stopWaiting();
    setAmountItemId(null);
    setScreen("merchant");
  }
  function selectMerchant(value: FlowMerchant) {
    // 从小票返回换商家或已有明细时不走快速路线，直接回到小票，建议到达后替换自动明细。
    const quick = !receiptVisited && !form.itemSummaries.length;
    const replacing = !quick && value.id !== form.selectedMerchantId;
    pendingQuickMerchantId.current = quick || replacing ? value.id : null;
    replacingAutomaticItems.current = replacing;
    waitStartSnapshot.current = receiptSnapshot;
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
    automaticItemIds: automaticItems.map((item) => item.id),
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
