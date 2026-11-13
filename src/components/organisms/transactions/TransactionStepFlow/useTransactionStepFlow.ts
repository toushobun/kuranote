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
import { useEntryReceiptGuard } from "../useEntryReceiptGuard";
import { hasReceiptChanges, type ReceiptSnapshot } from "./receiptChanges";
import type { ActionState } from "types/actions";
import type { TransactionStepFlowProps } from "./TransactionStepFlow.types";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";

// 选完商家后在明细与付款区显示读取状态，最多等待两秒；
// 之后晚到的建议只在用户还没动过小票时补上。
export const quickRouteSuggestionTimeoutMs = 2000;

export function useTransactionStepFlow(props: TransactionStepFlowProps) {
  // 等待建议数据的商家；只应用一次，超时后动过小票或已有输入时清空。
  const pendingQuickMerchantId = useRef<string | null>(null);
  const [loadingMerchantId, setLoadingMerchantId] = useState<string | null>(
    null,
  );
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
  const automaticItemIds = useRef<number[]>([]);
  const automaticPaymentKey = useRef<number | null>(null);
  const [showAutomaticNotice, setShowAutomaticNotice] = useState(false);
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
  const receipt: ReceiptSnapshot = {
    items: form.itemSummaries.map(
      ({
        id,
        categoryId,
        amount,
        specialStatus,
        refundCandidate,
        reimbursementCandidate,
      }) => ({
        id,
        categoryId,
        amount,
        specialStatus: specialStatus ?? null,
        refundCandidate: refundCandidate ?? null,
        reimbursementCandidate: reimbursementCandidate ?? null,
      }),
    ),
    payments: form.payments,
    note: form.note,
    transactionAt: form.transactionAtValue,
  };
  const receiptSnapshot = JSON.stringify([
    receipt.items,
    receipt.payments.map(({ accountId, amount }) => [accountId, amount]),
    receipt.note,
    receipt.transactionAt,
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
  const { receiptDirty, touched } = useReceiptChanges(
    receipt,
    receiptSnapshot,
    autoRevision,
    automaticItemIds,
    automaticPaymentKey,
  );
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
  const { guard } = useEntryReceiptGuard(
    receiptDirty,
    formId,
    props.onClose,
    props.draft,
  );
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
  useLayoutEffect(() => {
    // 清空自动内容提交后，先记录新基线，再处理本次读取。
    if (loadingMerchantId !== null) resetWaitStartSnapshot();
  }, [loadingMerchantId]);
  const applySuggestions = useEffectEvent(() => {
    if (!suggestionsReady || pendingQuickMerchantId.current !== merchant?.id)
      return;
    stopWaiting();
    if (
      touched ||
      pendingSuggestionSnapshot !== waitStartSnapshot.current ||
      form.itemSummaries.length > 0
    ) {
      return;
    }
    setAutoRevision((revision) => revision + 1);
    const recommended = props.accounts.find(
      (account) => account.id === props.suggestions?.recommendedAccountIds[0],
    );
    const primary = form.payments[0];
    const filledAccount = recommended && primary && !primary.accountId;
    if (filledAccount) {
      automaticPaymentKey.current = primary.key;
      form.handlePaymentAccountChange(primary.key, recommended.id);
      props.onAccountSelect(recommended);
    }
    const categoryIds = (props.suggestions?.automaticCategoryIds ?? []).filter(
      (id) =>
        itemsOptions.categoryOptions.some((category) => category.id === id),
    );
    automaticItemIds.current = categoryIds.map((categoryId) =>
      form.addItem(categoryId, "", null, null, null),
    );
    setShowAutomaticNotice(
      !!filledAccount || automaticItemIds.current.length > 0,
    );
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
    }, quickRouteSuggestionTimeoutMs);
    return () => clearTimeout(timer);
  }, [waiting, loadingMerchantId]);
  useEffect(() => {
    // 超时后或换商家后动过小票就丢弃晚到的建议，不覆盖用户输入。
    // 等待期间动过小票时，也立即结束读取提示。
    if (pendingSuggestionSnapshot === waitStartSnapshot.current) return;
    pendingQuickMerchantId.current = null;
    if (loadingMerchantId !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 用户已修改小票，不再等待过期的建议。
      setLoadingMerchantId(null);
    }
  }, [pendingSuggestionSnapshot, loadingMerchantId]);
  function selectMerchant(value: FlowMerchant) {
    const changing = value.id !== form.selectedMerchantId;
    form.handleMerchantChange(value.id);
    props.onMerchantSelect(value);
    // 重选当前商家时保留等待和晚到建议的关联状态。
    if (!changing) return;
    if (
      touched ||
      form.linkMerchantTouched ||
      form.itemSummaries.length > automaticItemIds.current.length
    ) {
      stopWaiting();
      return;
    }

    automaticItemIds.current.forEach((id) => form.removeItem(id));
    automaticItemIds.current = [];
    if (automaticPaymentKey.current !== null) {
      form.handlePaymentAccountChange(automaticPaymentKey.current, "");
      automaticPaymentKey.current = null;
    }
    setShowAutomaticNotice(false);
    setAutoRevision((revision) => revision + 1);
    if (!value.hasTransactions) {
      stopWaiting();
      return;
    }
    pendingQuickMerchantId.current = value.id;
    setLoadingMerchantId(value.id);
  }
  const merchantPicker = useReceiptMerchantPicker(selectMerchant);
  return {
    saveState,
    saveAction,
    saving,
    suggestions:
      !props.suggestionsMerchantId || suggestionsReady
        ? props.suggestions
        : undefined,
    form,
    itemsOptions,
    showAutomaticNotice: showAutomaticNotice && !touched,
    amountItemId,
    setAmountItemId,
    methodOpen,
    setMethodOpen,
    itemsLoading: waiting,
    paymentsLoading: waiting && !form.payments[0]?.accountId,
    merchantPicker,
    requestClose: guard.requestClose,
    dialogProps: guard.dialogProps,
    onValidationFailed: guard.cancelSave,
    formId,
  };
}

// 自动填充完成后记录基线。换商家、晚到建议和自动提示继续使用原来的修改口径。
function useReceiptChanges(
  receipt: ReceiptSnapshot,
  snapshot: string,
  revision: number,
  automaticItemIds: { current: number[] },
  automaticPaymentKey: { current: number | null },
) {
  const [baseline, setBaseline] = useState<{
    receipt: ReceiptSnapshot;
    snapshot: string;
    revision: number;
    itemIds: number[];
    paymentKey: number | null;
  }>({ receipt, snapshot, revision: 0, itemIds: [], paymentKey: null });
  const [touched, setTouched] = useState(false);
  const [clearedPaymentRevision, setClearedPaymentRevision] = useState<
    number | null
  >(null);
  const settled = revision > 0 && baseline.revision === revision;
  useLayoutEffect(() => {
    if (revision === baseline.revision) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 自动填充完成后同步干净基线。
    setBaseline({
      receipt,
      snapshot,
      revision,
      itemIds: automaticItemIds.current,
      paymentKey: automaticPaymentKey.current,
    });
  }, [
    automaticItemIds,
    automaticPaymentKey,
    baseline.revision,
    receipt,
    snapshot,
    revision,
  ]);

  if (settled && !touched && snapshot !== baseline.snapshot) setTouched(true);
  const automaticPayment = receipt.payments.find(
    ({ key }) => key === baseline.paymentKey,
  );
  // 清空后再次手动选择账户也算修改，即使选回了同一个账户。
  if (
    settled &&
    clearedPaymentRevision !== revision &&
    automaticPayment?.accountId === ""
  ) {
    setClearedPaymentRevision(revision);
  }
  const receiptDirty =
    settled &&
    (hasReceiptChanges(
      baseline.receipt,
      receipt,
      baseline.itemIds,
      baseline.paymentKey,
    ) ||
      (clearedPaymentRevision === revision && !!automaticPayment?.accountId));
  return { receiptDirty, touched };
}
