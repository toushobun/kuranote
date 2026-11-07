"use client";
import {
  useActionState,
  useEffect,
  useEffectEvent,
  useRef,
  useId,
  useLayoutEffect,
  useState,
} from "react";
import { useTransactionReceiptForm } from "organisms/transactions/TransactionConfirmStep/useTransactionReceiptForm";
import { unsavedChangesMessages } from "config/unsavedChangesMessages";
import type { TransactionFormInitialValues } from "organisms/transactions/TransactionForm/TransactionForm.types";
import { useReceiptMerchantPicker } from "organisms/transactions/ReceiptMerchantDrawer/useReceiptMerchantPicker";
import { useUnsavedChangesGuard } from "molecules/ui/UnsavedChangesDialog/useUnsavedChangesGuard";
import type { ActionState } from "types/actions";
import type { TransactionStepFlowProps } from "./TransactionStepFlow.types";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";

// 快速路线：选完商家后最多等待建议数据这么久，超时则直接进入小票；
// 之后晚到的建议只在用户还没动过小票时补上。
export const quickRouteSuggestionTimeoutMs = 2000;

export type TransactionStepFlowScreen = "merchant" | "receipt";

// 自动添加的明细及当时的分类，用于判断换商家时是否还没动过。
type AutomaticItem = { id: number; categoryId: string };

export function useTransactionStepFlow(props: TransactionStepFlowProps) {
  // 等待建议数据的商家；只应用一次，超时后动过小票或已有输入时清空。
  const pendingQuickMerchantId = useRef<string | null>(null);
  // 从小票换商家：建议到达时替换上一个商家没动过的自动明细，而不是跳过。
  const replacingAutomaticItems = useRef(false);
  // 快速路线等待建议数据期间停在选择商家，被点中的商家显示加载状态。
  const [loadingMerchantId, setLoadingMerchantId] = useState<string | null>(
    null,
  );
  const [screen, setScreen] = useState<TransactionStepFlowScreen>("merchant");
  const baseItemsOptions = props.itemsOptions ?? { categoryOptions: [] };
  const [initialValues] = useState<TransactionFormInitialValues>(() => ({
    items: baseItemsOptions.initialItems ?? [],
    merchantId: "",
    note: "",
    payments: baseItemsOptions.initialPayments ?? [
      { accountId: "", amount: null },
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
  const formId = useId();
  // 小票只有一份业务快照：不包含商家选择与编辑抽屉的临时状态。
  // 自动建议 / 初始时间完成后重建基线，只有用户改变付款、明细、备注、时间才算 dirty。
  const receiptDataSnapshot = JSON.stringify([
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
  // 等待晚到建议时还需检测是否正在编辑，避免替换正在打开的明细。
  const receiptSnapshot = JSON.stringify([
    receiptDataSnapshot,
    form.isSheetOpen,
    form.editingItemId,
    amountItemId,
  ]);
  const [autoRevision, setAutoRevision] = useState(0);
  const [baseline, setBaseline] = useState({
    snapshot: receiptDataSnapshot,
    revision: 0,
  });
  useLayoutEffect(() => {
    if (baseline.revision === autoRevision) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 在自动填充提交后的同一帧更新基线，避免把程序填入的内容误判为用户修改。
    setBaseline({ snapshot: receiptDataSnapshot, revision: autoRevision });
  }, [autoRevision, baseline.revision, receiptDataSnapshot]);
  const receiptDirty =
    baseline.revision === autoRevision &&
    receiptDataSnapshot !== baseline.snapshot;
  const guard = useUnsavedChangesGuard({
    isDirty: screen === "receipt" && receiptDirty,
    saveFormId: formId,
    saveLabel: unsavedChangesMessages.saveAndExit,
    onClose: props.onClose,
  });
  const [saveState, saveAction, saving] = useActionState<ActionState, FormData>(
    (state, data) => guard.runAction(() => props.action(state, data)),
    {},
  );
  const waitStartSnapshot = useRef(receiptSnapshot);
  const timeInitialized = !!form.transactionAtValue;
  const resetWaitStartSnapshot = useEffectEvent(() => {
    waitStartSnapshot.current = receiptSnapshot;
  });
  const initialTimeHandled = useRef(false);
  useEffect(() => {
    // 挂载后才填入本地当前时间，不算用户动过小票。
    if (!timeInitialized || initialTimeHandled.current) return;
    initialTimeHandled.current = true;
    resetWaitStartSnapshot();
    setAutoRevision((revision) => revision + 1);
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
  }
  function showReceipt() {
    setScreen("receipt");
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
    // 本次自动建议属于初始值；但已有人手动修改时不可重置其 dirty 基线。
    if (!receiptDirty) setAutoRevision((revision) => revision + 1);
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
  const waiting = !!loadingMerchantId;
  useEffect(() => {
    if (!waiting) return;
    // 获取失败按「没有建议」处理会直接到达；一直没有结果时也不阻断手动记账。
    // 加载中改点另一个商家时重新计时。
    // 超时后保留等待中的商家，晚到的建议在用户动过小票之前仍可补上。
    const timer = setTimeout(() => {
      setLoadingMerchantId(null);
      showReceipt();
    }, quickRouteSuggestionTimeoutMs);
    return () => clearTimeout(timer);
  }, [waiting, loadingMerchantId]);
  useEffect(() => {
    // 超时后或换商家后动过小票就丢弃晚到的建议，不覆盖用户输入。
    if (!waiting && receiptSnapshot !== waitStartSnapshot.current)
      pendingQuickMerchantId.current = null;
  }, [waiting, receiptSnapshot]);
  function selectMerchant(value: FlowMerchant) {
    // 已进入小票后换商家不走快速路线，留在小票，建议到达后替换自动明细。
    const quick = screen === "merchant" && !form.itemSummaries.length;
    const replacing = !quick && value.id !== form.selectedMerchantId;
    pendingQuickMerchantId.current = quick || replacing ? value.id : null;
    replacingAutomaticItems.current = replacing;
    waitStartSnapshot.current = receiptSnapshot;
    form.handleMerchantChange(value.id);
    props.onMerchantSelect(value);
    if (quick) setLoadingMerchantId(value.id);
    else showReceipt();
  }
  const merchantPicker = useReceiptMerchantPicker(selectMerchant);
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
    merchantPicker,
    requestClose: guard.requestClose,
    cancelPendingSave: guard.cancelPendingSave,
    dialogProps: guard.dialogProps,
    formId,
  };
}
