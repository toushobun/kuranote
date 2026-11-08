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
import type { TransactionFormInitialValues } from "organisms/transactions/TransactionForm/TransactionForm.types";
import { useReceiptMerchantPicker } from "organisms/transactions/ReceiptMerchantDrawer/useReceiptMerchantPicker";
import { useUnsavedChangesGuard } from "molecules/ui/UnsavedChangesDialog/useUnsavedChangesGuard";
import { unsavedChangesMessages } from "config/unsavedChangesMessages";
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
  // null 表示已隐藏，空数组表示只自动选了付款账户。
  const [noticeItemIds, setNoticeItemIds] = useState<readonly number[] | null>(
    null,
  );
  const { form, itemsOptions, amountItemId, setAmountItemId } =
    useTransactionReceiptForm({
      accounts: props.accounts,
      merchants: props.merchants,
      itemsOptions: baseItemsOptions,
      initialValues,
    });
  const formId = useId();
  // 开始等待建议时的小票；之后与之不同即视为用户动过小票
  //（选账户、加 / 删 / 编辑明细、改分类 / 金额 / 特殊状态 / 关联、改备注 / 时间）。
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
  // 晚到建议的保护还需要临时编辑状态；退出 dirty 只看已经写入小票的内容。
  const pendingSuggestionSnapshot = JSON.stringify([
    receiptSnapshot,
    form.isSheetOpen,
    form.editingItemId,
    amountItemId,
  ]);
  const waitStartSnapshot = useRef(pendingSuggestionSnapshot);
  // 商家选择、推荐账户、自动明细与初始时间不计入修改。
  // 基线与自动填充版本存在 state 中，避免在 render 期间读取 ref。
  const [autoRevision, setAutoRevision] = useState(0);
  const [baseline, setBaseline] = useState({
    snapshot: receiptSnapshot,
    revision: 0,
  });
  const receiptDirty =
    baseline.revision === autoRevision && receiptSnapshot !== baseline.snapshot;
  const timeInitialized = !!form.transactionAtValue;
  const resetWaitStartSnapshot = useEffectEvent(() => {
    waitStartSnapshot.current = pendingSuggestionSnapshot;
  });
  useEffect(() => {
    // 挂载后才填入本地当前时间，不算用户动过小票。
    if (!timeInitialized) return;
    resetWaitStartSnapshot();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 初始本地时间同步后更新自动填充版本。
    setAutoRevision((revision) => revision + 1);
  }, [timeInitialized]);
  useLayoutEffect(() => {
    if (baseline.revision === autoRevision) return;
    // 自动填充提交后的布局阶段同步干净基线，下一帧才恢复 dirty 判断。
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 自动建议应用完成后同步干净基线。
    setBaseline({ snapshot: receiptSnapshot, revision: autoRevision });
  }, [autoRevision, baseline.revision, receiptSnapshot]);
  const guard = useUnsavedChangesGuard({
    isDirty: screen === "receipt" && receiptDirty,
    saveFormId: formId,
    saveLabel: unsavedChangesMessages.saveAndExit,
    onClose: props.onClose,
  });
  const [saveState, saveAction, saving] = useActionState<ActionState, FormData>(
    (state, data) =>
      guard.runSaveAction(data, (values) => props.action(state, values)),
    {},
  );
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
    // 只有尚未手动填写的小票才允许自动建议重设干净基线。
    if (!receiptDirty) setAutoRevision((revision) => revision + 1);
    const recommended = props.accounts.find(
      (account) => account.id === props.suggestions?.recommendedAccountIds[0],
    );
    const primary = form.payments[0];
    const filledAccount = recommended && primary && !primary.accountId;
    if (filledAccount) {
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
    // 已有同一分类的明细时不重复追加。
    const added = categoryIds
      .filter((categoryId) => !remainingCategoryIds.has(categoryId))
      .map((categoryId) => ({
        id: form.addItem(categoryId, "", null, null, null),
        categoryId,
      }));
    setAutomaticItems([...kept, ...added]);
    setNoticeItemIds((previous) => {
      const remaining = (previous ?? kept.map(({ id }) => id)).filter(
        (id) => !removedIds.includes(id),
      );
      if (filledAccount || added.length) {
        return [...remaining, ...added.map(({ id }) => id)];
      }
      // 保留原提示，除非换商家已移除了提示所对应的全部明细。
      if (!previous) return null;
      return previous.length > 0 && remaining.length === 0 ? null : remaining;
    });
  });
  useEffect(() => {
    // 按商家标识同步异步到达的建议，pending 标识保证只应用一次。
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 后端建议在此处一次性同步至小票表单。
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
    if (!waiting && pendingSuggestionSnapshot !== waitStartSnapshot.current)
      pendingQuickMerchantId.current = null;
  }, [waiting, pendingSuggestionSnapshot]);
  function selectMerchant(value: FlowMerchant) {
    // 已进入小票后换商家不走快速路线，留在小票，建议到达后替换自动明细。
    const quick = screen === "merchant" && !form.itemSummaries.length;
    const replacing = !quick && value.id !== form.selectedMerchantId;
    pendingQuickMerchantId.current = quick || replacing ? value.id : null;
    replacingAutomaticItems.current = replacing;
    waitStartSnapshot.current = pendingSuggestionSnapshot;
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
    form: {
      ...form,
      handlePickerAdd() {
        const editing = form.itemSummaries.find(
          ({ id }) => id === form.editingItemId,
        );
        const committed = form.handlePickerAdd();
        if (
          committed &&
          (!editing || editing.categoryId !== form.pickerCategoryId)
        ) {
          setNoticeItemIds(null);
        }
        return committed;
      },
      updateItem(...args: Parameters<typeof form.updateItem>) {
        const [id, { amount }] = args;
        const item = form.itemSummaries.find((item) => item.id === id);
        form.updateItem(...args);
        if (item && amount !== undefined && amount !== item.amount) {
          setNoticeItemIds(null);
        }
      },
      removeItem(id: number) {
        form.removeItem(id);
        if (noticeItemIds?.includes(id)) setNoticeItemIds(null);
      },
      handlePaymentAccountChange(key: number, accountId: string) {
        const payment = form.payments.find((row) => row.key === key);
        form.handlePaymentAccountChange(key, accountId);
        if (payment && payment.accountId !== accountId) setNoticeItemIds(null);
      },
    },
    itemsOptions,
    showAutomaticNotice: noticeItemIds !== null,
    amountItemId,
    setAmountItemId,
    methodOpen,
    setMethodOpen,
    loadingMerchantId,
    merchantPicker,
    requestClose: guard.requestClose,
    dialogProps: guard.dialogProps,
    onValidationFailed: guard.cancelSave,
    formId,
  };
}
