"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { useEditTransactionDirty } from "organisms/transactions/EditTransactionDirtyContext/EditTransactionDirtyContext";
import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import type {
  TransactionBusinessStatus,
  TransactionCategoryOption,
  TransactionRefundCandidate,
  TransactionType,
} from "types/transactions";
import {
  transactionFormValidationMessages,
  transactionLinkMessages,
  transactionPaymentFieldsMessages,
  type TransactionLinkKind,
} from "utils/transactionMessages";
import { getAmountDecimalPlaces } from "utils/transactionAmountInput";
import {
  resolveTransactionBusinessStatus,
  formatRefundMinorUnits,
  summarizeRefundAllocationAmounts,
  summarizeReimbursementAllocationAmounts,
  toRefundMinorUnits,
  transactionPaymentValidationErrorMessages,
  validateTransactionPayments,
} from "internal/transaction";
import {
  composeTransactionDateTimeLocalValue,
  formatDateTimeLocalInputValue,
  getNowDateTimeLocalValue,
  hasLinkCandidateCurrencyMismatch,
  splitDateTimeLocalValue,
} from "utils/transactions";

import {
  reconcileTransactionPayments,
  useTransactionPaymentFields,
} from "../TransactionPaymentFields/useTransactionPaymentFields";
import type {
  TransactionFieldErrors,
  TransactionFormInitialValues,
  TransactionFormItem,
  TransactionFormProps,
  TransactionItemSummary,
  TransactionPickerErrors,
} from "./TransactionForm.types";
import {
  buildCategoryPickerGroups,
  getCurrencyMismatchedLinkKinds,
  isValidMoneyText,
  isValidTransactionFormItem,
  sumTransactionItemBusinessTotals,
} from "./TransactionForm.utils";

type UseTransactionFormOptions = Pick<
  TransactionFormProps,
  | "accountOptions"
  | "categoryOptions"
  | "initialType"
  | "initialValues"
  | "merchantOptions"
  | "onSubmitDisabledChange"
> & {
  deferPickerAmount?: boolean;
  onPickerItemCommit?: (itemId: number) => void;
};

export function useTransactionForm({
  accountOptions,
  categoryOptions,
  initialType,
  initialValues,
  merchantOptions,
  onSubmitDisabledChange,
  deferPickerAmount = false,
  onPickerItemCommit,
}: UseTransactionFormOptions) {
  const markEditDirty = useEditTransactionDirty();
  const confirm = useConfirmDialog();
  const nextItemIdRef = useRef((initialValues?.items.length ?? 0) + 1);
  const merchantFieldRef = useRef<HTMLDivElement>(null);
  const accountFieldRef = useRef<HTMLDivElement>(null);
  const itemsFieldRef = useRef<HTMLDivElement>(null);
  const isFirstRenderRef = useRef(true);
  const [selectedType, setSelectedType] = useState<TransactionType>(
    initialValues?.type ?? initialType ?? "expense",
  );
  const paymentFields = useTransactionPaymentFields(initialValues?.payments);
  const selectedAccountId = paymentFields.primaryAccountId;
  const [selectedMerchantId, setSelectedMerchantId] = useState(
    initialValues?.merchantId ?? "",
  );
  const [fieldErrors, setFieldErrors] = useState<TransactionFieldErrors>({});
  const [itemsByType, setItemsByType] = useState<
    Record<TransactionType, TransactionFormItem[]>
  >(() =>
    createInitialItemsByType(
      initialValues,
      new Map(categoryOptions.map((category) => [category.id, category])),
    ),
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [selectedCategoryGroupId, setSelectedCategoryGroupId] = useState("");
  const [pickerCategoryId, setPickerCategoryId] = useState("");
  const [pickerAmount, setPickerAmount] = useState("");
  const [pickerSpecialStatus, setPickerSpecialStatus] =
    useState<TransactionFormItem["specialStatus"]>(null);
  const [pickerRefundCandidate, setPickerRefundCandidate] =
    useState<TransactionRefundCandidate | null>(null);
  const [pickerReimbursementCandidate, setPickerReimbursementCandidate] =
    useState<TransactionRefundCandidate | null>(null);
  const [pickerErrors, setPickerErrors] = useState<TransactionPickerErrors>({});
  const [note, setNote] = useState(initialValues?.note ?? "");
  const [linkNotice, setLinkNotice] = useState<string | null>(null);
  const [transactionDate, setTransactionDate] = useState("");
  const [transactionTime, setTransactionTime] = useState("");
  const [timeZoneOffsetMinutes, setTimeZoneOffsetMinutes] = useState("");

  const allDisplayItems = [...itemsByType.expense, ...itemsByType.income];

  useEffect(() => {
    const localValue = initialValues?.transactionAt
      ? formatDateTimeLocalInputValue(initialValues.transactionAt)
      : getNowDateTimeLocalValue();
    const nextDateTime = splitDateTimeLocalValue(localValue);

    // eslint-disable-next-line react-hooks/set-state-in-effect -- 客户端挂载后同步本地时区时间，避免服务端水合差异。
    setTransactionDate(nextDateTime.date);
    setTransactionTime(nextDateTime.time);
    setTimeZoneOffsetMinutes(String(new Date().getTimezoneOffset()));
  }, [initialValues?.transactionAt]);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (!initialValues && initialType) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 新增页外层 tab 切换时同步内部类型，编辑页有 initialValues 时忽略。
      setSelectedType(initialType);
      setIsSheetOpen(false);
      setEditingItemId(null);
      setPickerCategoryId("");
      setPickerAmount("");
      setPickerSpecialStatus(null);
      setPickerRefundCandidate(null);
      setPickerReimbursementCandidate(null);
      setPickerErrors({});
      setSelectedCategoryGroupId("");
      setFieldErrors((current) => ({ ...current, items: undefined }));
    }
  }, [initialType, initialValues]);

  const allNormalCategoryOptions = useMemo(
    () =>
      categoryOptions.filter(
        (category) => category.type === "expense" || category.type === "income",
      ),
    [categoryOptions],
  );
  const categoryGroups = useMemo(
    () => buildCategoryPickerGroups(allNormalCategoryOptions),
    [allNormalCategoryOptions],
  );
  const categoryById = useMemo(
    () => new Map(categoryOptions.map((category) => [category.id, category])),
    [categoryOptions],
  );

  const effectiveCategoryGroupId = categoryGroups.some(
    (group) => group.id === selectedCategoryGroupId,
  )
    ? selectedCategoryGroupId
    : (categoryGroups[0]?.id ?? "");
  const selectedCategoryGroup =
    categoryGroups.find((group) => group.id === effectiveCategoryGroupId) ??
    categoryGroups[0];
  const selectedAccount = accountOptions.find(
    (account) => account.id === selectedAccountId,
  );
  const selectedMerchant = merchantOptions.find(
    (merchant) => merchant.id === selectedMerchantId,
  );
  const itemSummaries: TransactionItemSummary[] = allDisplayItems.map(
    (item) => ({
      ...item,
      category: categoryById.get(item.categoryId),
    }),
  );
  const pickerSpecialStatusLocked = Boolean(
    allDisplayItems.find((item) => item.id === editingItemId)
      ?.specialStatusLocked,
  );
  const expenseTotal = itemsByType.expense.reduce((sum, item) => {
    if (!isValidMoneyText(item.amount, selectedAccount?.currency)) return sum;
    return sum + Number(item.amount);
  }, 0);
  const incomeTotal = itemsByType.income.reduce((sum, item) => {
    if (!isValidMoneyText(item.amount, selectedAccount?.currency)) return sum;
    return sum + Number(item.amount);
  }, 0);
  const paymentReconciliation = reconcileTransactionPayments({
    currency: selectedAccount?.currency,
    itemAmounts: allDisplayItems.map((item) => item.amount),
    payments: paymentFields.payments,
  });
  const hasValidItems =
    allDisplayItems.length > 0 &&
    allDisplayItems.every((item) =>
      isValidTransactionFormItem(item, selectedAccount?.currency),
    );
  const transactionAtValue = composeTransactionDateTimeLocalValue(
    transactionDate,
    transactionTime,
  );
  const isSubmitDisabled =
    accountOptions.length === 0 ||
    merchantOptions.length === 0 ||
    allNormalCategoryOptions.length === 0 ||
    !transactionAtValue ||
    (paymentFields.isMultiAccount && !paymentReconciliation.isBalanced);

  useEffect(() => {
    onSubmitDisabledChange?.(isSubmitDisabled);
  }, [isSubmitDisabled, onSubmitDisabledChange]);

  const signedTotalAmount =
    allDisplayItems.length > 0
      ? formatNetAmount(incomeTotal - expenseTotal, selectedAccount?.currency)
      : "未填写金额";
  const { businessExpenseTotal, businessIncomeTotal, hasBusinessOffset } =
    sumTransactionItemBusinessTotals([
      ...itemsByType.expense.map((item) => ({
        ...item,
        type: "expense" as const,
      })),
      ...itemsByType.income.map((item) => ({
        ...item,
        type: "income" as const,
      })),
    ]);
  const businessTotalAmount = hasBusinessOffset
    ? formatNetAmount(
        businessIncomeTotal - businessExpenseTotal,
        selectedAccount?.currency,
      )
    : null;

  function addItem(
    categoryId: string,
    amount: string,
    specialStatus: TransactionFormItem["specialStatus"],
    refundCandidate: TransactionRefundCandidate | null,
    reimbursementCandidate: TransactionRefundCandidate | null,
  ) {
    markEditDirty?.();
    const categoryType = categoryById.get(categoryId)?.type ?? selectedType;
    const itemId = nextItemIdRef.current;
    nextItemIdRef.current += 1;
    setItemsByType((current) => ({
      ...current,
      [categoryType]: [
        ...current[categoryType],
        {
          amount,
          businessNetAmount: getNewItemBusinessNetAmount(
            amount,
            specialStatus,
            refundCandidate,
            reimbursementCandidate,
          ),
          businessStatus: getFormItemBusinessStatus(
            specialStatus,
            refundCandidate,
            reimbursementCandidate,
            selectedAccount?.currency,
          ),
          categoryId,
          id: itemId,
          refundCandidate,
          reimbursementCandidate,
          specialStatus,
        },
      ],
    }));
    if (fieldErrors.items) {
      setFieldErrors((current) => ({ ...current, items: undefined }));
    }
    return itemId;
  }

  function updateItem(
    itemId: number,
    values: Partial<Omit<TransactionFormItem, "id">>,
  ) {
    markEditDirty?.();
    const mergeValues = (item: TransactionFormItem) => {
      if (item.id !== itemId) return item;
      const nextItem = { ...item, ...values };
      if (values.amount === undefined) return nextItem;
      const categoryType = categoryById.get(nextItem.categoryId)?.type;
      return {
        ...nextItem,
        businessNetAmount: getUpdatedItemBusinessNetAmount(
          nextItem,
          item.amount,
          categoryType,
        ),
      };
    };
    setItemsByType((current) => ({
      expense: current.expense.map(mergeValues),
      income: current.income.map(mergeValues),
    }));
  }

  function replaceItem(
    itemId: number,
    categoryId: string,
    amount: string,
    specialStatus: TransactionFormItem["specialStatus"],
    refundCandidate: TransactionRefundCandidate | null,
    reimbursementCandidate: TransactionRefundCandidate | null,
  ) {
    markEditDirty?.();
    const categoryType = categoryById.get(categoryId)?.type ?? selectedType;
    const businessStatus = getFormItemBusinessStatus(
      specialStatus,
      refundCandidate,
      reimbursementCandidate,
      selectedAccount?.currency,
    );

    setItemsByType((current) => {
      const inExpense = current.expense.some((item) => item.id === itemId);
      const sourceType: TransactionType = inExpense ? "expense" : "income";

      if (sourceType === categoryType) {
        return {
          ...current,
          [categoryType]: current[categoryType].map((item) =>
            item.id === itemId
              ? withUpdatedItemBusinessNetAmount(
                  {
                    ...item,
                    amount,
                    businessStatus,
                    categoryId,
                    refundCandidate,
                    reimbursementCandidate,
                    specialStatus,
                  },
                  item.amount,
                  categoryType,
                )
              : item,
          ),
        };
      }

      const existingItem = current[sourceType].find(
        (item) => item.id === itemId,
      );
      if (!existingItem) return current;

      const moved: Record<TransactionType, TransactionFormItem[]> = {
        expense: current.expense.filter((item) => item.id !== itemId),
        income: current.income.filter((item) => item.id !== itemId),
      };
      moved[categoryType] = [
        ...moved[categoryType],
        withUpdatedItemBusinessNetAmount(
          {
            ...existingItem,
            amount,
            businessStatus,
            categoryId,
            refundCandidate,
            reimbursementCandidate,
            specialStatus,
          },
          existingItem.amount,
          categoryType,
        ),
      ];

      return moved;
    });
  }

  function removeItem(itemId: number) {
    markEditDirty?.();
    setItemsByType((current) => ({
      expense: current.expense.filter((item) => item.id !== itemId),
      income: current.income.filter((item) => item.id !== itemId),
    }));
    if (fieldErrors.items) {
      setFieldErrors((current) => ({ ...current, items: undefined }));
    }
    if (editingItemId === itemId) {
      setEditingItemId(null);
      setPickerCategoryId("");
      setPickerAmount("");
      setPickerSpecialStatus(null);
      setPickerRefundCandidate(null);
      setPickerReimbursementCandidate(null);
      setPickerErrors({});
    }
  }

  function openSheet() {
    setEditingItemId(null);
    setPickerCategoryId("");
    setPickerAmount("");
    setPickerSpecialStatus(null);
    setPickerRefundCandidate(null);
    setPickerReimbursementCandidate(null);
    setPickerErrors({});
    setSelectedCategoryGroupId(categoryGroups[0]?.id ?? "");
    setIsSheetOpen(true);
  }

  function openItemSheet(itemId: number) {
    const item = allDisplayItems.find(
      (currentItem) => currentItem.id === itemId,
    );
    if (!item) return;

    const categoryGroup = categoryGroups.find((group) =>
      group.categories.some((category) => category.id === item.categoryId),
    );

    setEditingItemId(itemId);
    setPickerCategoryId(item.categoryId);
    setPickerAmount(item.amount);
    setPickerSpecialStatus(item.specialStatus);
    setPickerRefundCandidate(item.refundCandidate ?? null);
    setPickerReimbursementCandidate(item.reimbursementCandidate ?? null);
    setPickerErrors({});
    setSelectedCategoryGroupId(
      categoryGroup?.id ?? categoryGroups[0]?.id ?? "",
    );
    setIsSheetOpen(true);
  }

  function closeSheet() {
    setIsSheetOpen(false);
    setEditingItemId(null);
  }

  function handlePickerGroupSelect(groupId: string) {
    setSelectedCategoryGroupId(groupId);
    setPickerCategoryId("");
    setPickerErrors({});
  }

  function handlePickerCategoryToggle(categoryId: string) {
    setPickerCategoryId((current) =>
      current === categoryId ? "" : categoryId,
    );
    const categoryType = categoryById.get(categoryId)?.type;
    if (categoryType === "income") {
      setPickerSpecialStatus(null);
    } else if (categoryType === "expense") {
      setPickerRefundCandidate(null);
      setPickerReimbursementCandidate(null);
    }
    if (pickerErrors.category) {
      setPickerErrors((current) => ({ ...current, category: undefined }));
    }
  }

  function handlePickerAmountChange(amount: string) {
    setPickerAmount(amount);
    if (pickerErrors.amount) {
      setPickerErrors((current) => ({ ...current, amount: undefined }));
    }
  }

  function handlePickerAdd() {
    const errors: TransactionPickerErrors = {};
    if (!pickerCategoryId) {
      errors.category = transactionFormValidationMessages.categoryRequired;
    }
    if (
      !deferPickerAmount &&
      !isValidMoneyText(pickerAmount, selectedAccount?.currency)
    ) {
      errors.amount = transactionFormValidationMessages.amountInvalid;
    } else if (
      !deferPickerAmount &&
      pickerRefundCandidate &&
      Number(pickerAmount) <= 0
    ) {
      errors.amount = "退款金额必须大于 0。";
    }

    if (Object.keys(errors).length > 0) {
      setPickerErrors(errors);
      return false;
    }

    setPickerErrors({});
    if (editingItemId === null) {
      const itemId = addItem(
        pickerCategoryId,
        pickerAmount,
        pickerSpecialStatus,
        pickerRefundCandidate,
        pickerReimbursementCandidate,
      );
      onPickerItemCommit?.(itemId);
    } else {
      replaceItem(
        editingItemId,
        pickerCategoryId,
        pickerAmount,
        pickerSpecialStatus,
        pickerRefundCandidate,
        pickerReimbursementCandidate,
      );
    }
    // 编辑已有明细时，只有金额还空着才通知（打开金额键盘）。
    if (editingItemId !== null && !pickerAmount.trim())
      onPickerItemCommit?.(editingItemId);
    setEditingItemId(null);
    setPickerCategoryId("");
    setPickerAmount("");
    setPickerSpecialStatus(null);
    setPickerRefundCandidate(null);
    setPickerReimbursementCandidate(null);
    return true;
  }

  function handleMerchantChange(merchantId: string) {
    markEditDirty?.();
    setSelectedMerchantId(merchantId);
    if (fieldErrors.merchant) {
      setFieldErrors((current) => ({ ...current, merchant: undefined }));
    }
  }

  function handlePaymentAccountChange(key: number, accountId: string) {
    if (key !== paymentFields.payments[0]?.key) {
      markEditDirty?.();
      paymentFields.changeAccount(key, accountId);
      clearAccountFieldError();
      return;
    }
    handlePrimaryAccountChange(key, accountId);
  }

  function handlePaymentAmountChange(key: number, amount: string) {
    markEditDirty?.();
    paymentFields.changeAmount(key, amount);
    clearAccountFieldError();
  }

  function handlePaymentAmountCommit(key: number) {
    paymentFields.commitAmount(key, {
      currency: selectedAccount?.currency,
      itemTotal: paymentReconciliation.itemTotal,
    });
  }

  // 多账户仅限纯支出：已有收入明细时先确认删除收入明细，再展开为多账户（#930）。
  async function handleAddPayment() {
    const expenseItems = itemsByType.expense;
    if (itemsByType.income.length > 0) {
      const confirmed = await confirm({
        confirmLabel: transactionPaymentFieldsMessages.removeIncomeItemsConfirm,
        description:
          transactionPaymentFieldsMessages.removeIncomeItemsDescription,
        title: transactionPaymentFieldsMessages.removeIncomeItemsTitle,
        tone: "delete",
      });
      if (!confirmed) return;
      setItemsByType((current) => ({ ...current, income: [] }));
    }
    markEditDirty?.();
    // 首行预填当前明细合计（单账户时它实际承担的金额，没有明细时为 0），新增行为 0。
    paymentFields.addPayment(
      reconcileTransactionPayments({
        currency: selectedAccount?.currency,
        itemAmounts: expenseItems.map((item) => item.amount),
        payments: [],
      }).itemTotal,
    );
    clearAccountFieldError();
  }

  function handleRemovePayment(key: number) {
    markEditDirty?.();
    paymentFields.removePayment(key, selectedAccount?.currency);
    clearAccountFieldError();
  }

  function clearAccountFieldError() {
    if (fieldErrors.account) {
      setFieldErrors((current) => ({ ...current, account: undefined }));
    }
  }

  // 首个付款账户决定记录币种，切换时同步检查退款 / 报销关联的币种。
  function handlePrimaryAccountChange(key: number, accountId: string) {
    markEditDirty?.();
    paymentFields.changeAccount(key, accountId);
    const nextAccount = accountOptions.find(
      (account) => account.id === accountId,
    );
    // 已保存的关联不能在普通保存中解除（#574），保留并提示先解除关联；本次新选的关联清除并提示重新选择。
    const editingItem = itemsByType.income.find(
      (item) => item.id === editingItemId,
    );
    const pickerLinkKinds = splitCurrencyMismatchedLinkKinds(
      {
        persistedId: editingItem?.persistedId,
        refundCandidate: pickerRefundCandidate,
        reimbursementCandidate: pickerReimbursementCandidate,
      },
      nextAccount?.currency,
      initialValues,
    );
    // 明细中已加入的关联与抽屉暂存的关联统一收集，任何一处受影响都要提示。
    const savedKinds = new Set<TransactionLinkKind>(pickerLinkKinds.saved);
    const clearedKinds = new Set<TransactionLinkKind>(pickerLinkKinds.cleared);
    itemsByType.income.forEach((item) => {
      const { cleared, saved } = splitCurrencyMismatchedLinkKinds(
        item,
        nextAccount?.currency,
        initialValues,
      );
      saved.forEach((kind) => savedKinds.add(kind));
      cleared.forEach((kind) => clearedKinds.add(kind));
    });
    setItemsByType((current) => ({
      ...current,
      income: current.income.map((item) => {
        const { cleared } = splitCurrencyMismatchedLinkKinds(
          item,
          nextAccount?.currency,
          initialValues,
        );
        if (cleared.length === 0) {
          return item;
        }

        const refundCandidate = cleared.includes("refund")
          ? null
          : (item.refundCandidate ?? null);
        const reimbursementCandidate = cleared.includes("reimbursement")
          ? null
          : (item.reimbursementCandidate ?? null);
        return {
          ...item,
          businessStatus: getFormItemBusinessStatus(
            item.specialStatus,
            refundCandidate,
            reimbursementCandidate,
            nextAccount?.currency,
          ),
          businessNetAmount: getNewItemBusinessNetAmount(
            item.amount,
            item.specialStatus,
            refundCandidate,
            reimbursementCandidate,
          ),
          refundCandidate,
          reimbursementCandidate,
        };
      }),
    }));

    if (pickerLinkKinds.cleared.includes("refund")) {
      setPickerRefundCandidate(null);
    }
    if (pickerLinkKinds.cleared.includes("reimbursement")) {
      setPickerReimbursementCandidate(null);
    }
    const orderedSavedKinds = orderLinkKinds(savedKinds);
    const orderedClearedKinds = orderLinkKinds(clearedKinds);
    const notices = [
      orderedSavedKinds.length > 0
        ? transactionLinkMessages.savedLinkCurrencyLocked(orderedSavedKinds)
        : null,
      orderedClearedKinds.length > 0
        ? transactionLinkMessages.accountCurrencyChanged(orderedClearedKinds)
        : null,
    ].filter((notice) => notice !== null);
    setLinkNotice(notices.length > 0 ? notices.join("") : null);

    clearAccountFieldError();
  }

  // 退款与报销候选共用同一套拒绝判断：未选账户时提示先选账户，币种不一致时提示重新选择。
  function getCandidateRejectionNotice(
    kind: TransactionLinkKind,
    candidate: TransactionRefundCandidate | null,
  ) {
    if (!candidate) return null;
    if (!selectedAccount) {
      return transactionLinkMessages.candidateAccountRequired(kind);
    }
    if (hasLinkCandidateCurrencyMismatch(candidate, selectedAccount.currency)) {
      return transactionLinkMessages.candidateCurrencyMismatch(kind);
    }
    return null;
  }

  // 付款账户的提交前校验与 Service 共用 validateTransactionPayments。
  function getAccountFieldError() {
    if (paymentFields.payments.some((payment) => !payment.accountId)) {
      return transactionFormValidationMessages.accountRequired;
    }
    if (!hasValidItems) return null;
    const validation = validateTransactionPayments({
      accountOptions,
      items: allDisplayItems.map((item) => ({
        amount: item.amount,
        categoryType: getNormalCategoryType(
          categoryById.get(item.categoryId)?.type,
        ),
      })),
      payments: paymentFields.submittedPayments,
    });
    return validation.ok
      ? null
      : transactionPaymentValidationErrorMessages[validation.error];
  }

  function handleNoteChange(
    event?: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    if (event) setNote(event.target.value);
    markEditDirty?.();
  }

  function handleDateChange(date: string) {
    markEditDirty?.();
    setTransactionDate(date);
  }

  function handleTimeChange(time: string) {
    markEditDirty?.();
    setTransactionTime(time);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!transactionAtValue) {
      cancelDefaultEvent(event);
      return;
    }

    const errors: TransactionFieldErrors = {};
    if (!selectedMerchantId) {
      errors.merchant = transactionFormValidationMessages.merchantRequired;
    }
    if (!hasValidItems) {
      errors.items = transactionFormValidationMessages.itemsRequired;
    }
    const accountError = getAccountFieldError();
    if (accountError) {
      errors.account = accountError;
    }

    if (Object.keys(errors).length > 0) {
      cancelDefaultEvent(event);
      setFieldErrors(errors);
      setTimeout(() => {
        const firstErrorRef = errors.merchant
          ? merchantFieldRef
          : errors.account
            ? accountFieldRef
            : itemsFieldRef;
        firstErrorRef.current?.scrollIntoView?.({
          behavior: "smooth",
          block: "center",
        });
      }, 0);
    } else {
      setFieldErrors({});
    }
  }

  return {
    note,
    addItem,
    accountFieldRef,
    accountFieldError: getAccountFieldError(),
    hasValidItems,
    allNormalCategoryOptions,
    categoryGroups,
    closeSheet,
    editingItemId,
    fieldErrors,
    handleAddPayment,
    handleDateChange,
    handleMerchantChange,
    handleNoteChange,
    handlePickerAdd,
    handlePickerAmountChange,
    handlePickerCategoryToggle,
    handlePickerGroupSelect,
    handlePaymentAccountChange,
    handlePaymentAmountChange,
    handlePaymentAmountCommit,
    handleRemovePayment,
    handleSubmit,
    handleTimeChange,
    isMultiAccount: paymentFields.isMultiAccount,
    isSheetOpen,
    isSubmitDisabled,
    linkNotice,
    itemSummaries,
    itemsFieldRef,
    merchantFieldRef,
    openItemSheet,
    openSheet,
    paymentReconciliation,
    payments: paymentFields.payments,
    pickerAmount,
    pickerCategoryId,
    pickerErrors,
    pickerRefundCandidate,
    pickerReimbursementCandidate,
    pickerSpecialStatus,
    pickerSpecialStatusLocked,
    removeItem,
    businessTotalAmount,
    expenseTotal,
    incomeTotal,
    selectedAccount,
    selectedAccountId,
    selectedCategoryGroup,
    selectedMerchant,
    selectedMerchantId,
    selectedType,
    setPickerSpecialStatus,
    setPickerRefundCandidate: (
      candidate: TransactionRefundCandidate | null,
    ) => {
      const rejectionNotice = getCandidateRejectionNotice("refund", candidate);
      if (rejectionNotice) {
        setPickerRefundCandidate(null);
        setLinkNotice(rejectionNotice);
        return;
      }
      setPickerRefundCandidate(candidate);
      if (candidate) setPickerReimbursementCandidate(null);
      setLinkNotice(null);
    },
    setPickerReimbursementCandidate: (
      candidate: TransactionRefundCandidate | null,
    ) => {
      const rejectionNotice = getCandidateRejectionNotice(
        "reimbursement",
        candidate,
      );
      if (rejectionNotice) {
        setPickerReimbursementCandidate(null);
        setLinkNotice(rejectionNotice);
        return;
      }
      setPickerReimbursementCandidate(candidate);
      if (candidate) setPickerRefundCandidate(null);
      setLinkNotice(null);
    },
    signedTotalAmount,
    timeZoneOffsetMinutes,
    transactionAtValue,
    transactionDate,
    transactionTime,
    updateItem,
  };
}

function createInitialItemsByType(
  initialValues?: TransactionFormInitialValues,
  categoryById?: Map<string, TransactionCategoryOption>,
): Record<TransactionType, TransactionFormItem[]> {
  const result: Record<TransactionType, TransactionFormItem[]> = {
    expense: [],
    income: [],
  };

  if (!initialValues) return result;

  initialValues.items.forEach((item, index) => {
    const categoryType =
      categoryById?.get(item.categoryId)?.type ?? initialValues.type;
    result[categoryType].push({
      ...item,
      id: index + 1,
      persistedId: item.id,
      specialStatusLocked: Boolean(item.specialStatus),
    });
  });

  return result;
}

const linkCandidateKeys = {
  refund: "refundCandidate",
  reimbursement: "reimbursementCandidate",
} as const satisfies Record<TransactionLinkKind, keyof TransactionFormItem>;

type TransactionFormItemLinks = Pick<
  TransactionFormItem,
  "persistedId" | "refundCandidate" | "reimbursementCandidate"
>;

// 「已保存的关联」：持久化明细当前的关联对象与编辑页加载时（initialValues）相同。
// 新建表单、新增明细或本次重新选择的关联都视为「本次新选的关联」。
function isSavedLink(
  links: TransactionFormItemLinks,
  kind: TransactionLinkKind,
  initialValues?: TransactionFormInitialValues,
) {
  if (!links.persistedId) return false;
  const key = linkCandidateKeys[kind];
  const savedCandidateId = initialValues?.items.find(
    (item) => item.id === links.persistedId,
  )?.[key]?.id;
  return Boolean(savedCandidateId) && savedCandidateId === links[key]?.id;
}

function splitCurrencyMismatchedLinkKinds(
  links: TransactionFormItemLinks,
  currency: string | undefined,
  initialValues?: TransactionFormInitialValues,
) {
  const mismatchedKinds = getCurrencyMismatchedLinkKinds(links, currency);
  return {
    cleared: mismatchedKinds.filter(
      (kind) => !isSavedLink(links, kind, initialValues),
    ),
    saved: mismatchedKinds.filter((kind) =>
      isSavedLink(links, kind, initialValues),
    ),
  };
}

function orderLinkKinds(kinds: ReadonlySet<TransactionLinkKind>) {
  return (["refund", "reimbursement"] as const).filter((kind) =>
    kinds.has(kind),
  );
}

function getFormItemBusinessStatus(
  specialStatus: TransactionFormItem["specialStatus"],
  refundCandidate: TransactionRefundCandidate | null,
  reimbursementCandidate: TransactionRefundCandidate | null,
  currency?: string,
): TransactionBusinessStatus | null {
  return resolveTransactionBusinessStatus({
    currency,
    isRefundIncome: Boolean(refundCandidate),
    isReimbursementIncome: Boolean(reimbursementCandidate),
    specialStatus,
  });
}

function getNormalCategoryType(type: TransactionType | string | undefined) {
  return type === "expense" || type === "income" ? type : null;
}

function cancelDefaultEvent(event: { preventDefault(): void }) {
  event.preventDefault();
}

function formatNetAmount(net: number, currency?: string) {
  const value = parseFloat(net.toFixed(getAmountDecimalPlaces(currency)));
  if (value === 0) return "0";
  return value > 0 ? `+${value}` : `${value}`;
}

function toSignedBusinessNetMinorUnits(value: string) {
  const text = value.trim();
  const isNegative = text.startsWith("-");
  const units = toRefundMinorUnits(isNegative ? text.slice(1) : text);
  if (units === null) return null;
  return isNegative ? -units : units;
}

function getNewItemBusinessNetAmount(
  amount: string,
  specialStatus: TransactionFormItem["specialStatus"],
  refundCandidate: TransactionRefundCandidate | null,
  reimbursementCandidate: TransactionRefundCandidate | null,
) {
  if (specialStatus === "reimbursed") return "0";
  if (reimbursementCandidate) {
    return summarizeReimbursementAllocationAmounts(
      amount,
      reimbursementCandidate.remainingRefundableAmount,
    )?.netIncomeAmount;
  }
  if (!refundCandidate) return undefined;

  return summarizeRefundAllocationAmounts(
    amount,
    refundCandidate.remainingRefundableAmount,
  )?.netIncomeAmount;
}

function getUpdatedItemBusinessNetAmount(
  item: TransactionFormItem,
  previousAmount: string,
  categoryType?: TransactionType,
) {
  if (categoryType === "income") {
    return getNewItemBusinessNetAmount(
      item.amount,
      item.specialStatus,
      item.refundCandidate ?? null,
      item.reimbursementCandidate ?? null,
    );
  }
  const amountUnits = toRefundMinorUnits(item.amount);
  const previousAmountUnits = toRefundMinorUnits(previousAmount);
  const businessNetAmountUnits =
    item.businessNetAmount === undefined
      ? null
      : toSignedBusinessNetMinorUnits(item.businessNetAmount);
  if (
    amountUnits === null ||
    previousAmountUnits === null ||
    businessNetAmountUnits === null ||
    businessNetAmountUnits === previousAmountUnits
  ) {
    return undefined;
  }

  return formatRefundMinorUnits(
    businessNetAmountUnits + amountUnits - previousAmountUnits,
  );
}

function withUpdatedItemBusinessNetAmount(
  item: TransactionFormItem,
  previousAmount: string,
  categoryType?: TransactionType,
) {
  return {
    ...item,
    businessNetAmount: getUpdatedItemBusinessNetAmount(
      item,
      previousAmount,
      categoryType,
    ),
  };
}
