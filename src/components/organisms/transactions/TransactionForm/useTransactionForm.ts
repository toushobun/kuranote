"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { useEditTransactionDirty } from "organisms/transactions/EditTransactionDirtyContext/EditTransactionDirtyContext";
import type {
  TransactionBusinessStatus,
  TransactionCategoryOption,
  TransactionRefundCandidate,
  TransactionType,
} from "types/transactions";
import { transactionFormValidationMessages } from "utils/transactionMessages";
import { allocateRefundAmount } from "internal/transaction";
import {
  composeTransactionDateTimeLocalValue,
  formatDateTimeLocalInputValue,
  getNowDateTimeLocalValue,
  splitDateTimeLocalValue,
} from "utils/transactions";

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
  isValidMoneyText,
} from "./TransactionForm.utils";

type UseTransactionFormOptions = Pick<
  TransactionFormProps,
  | "accountOptions"
  | "categoryOptions"
  | "initialType"
  | "initialValues"
  | "merchantOptions"
  | "onSubmitDisabledChange"
>;

export function useTransactionForm({
  accountOptions,
  categoryOptions,
  initialType,
  initialValues,
  merchantOptions,
  onSubmitDisabledChange,
}: UseTransactionFormOptions) {
  const markEditDirty = useEditTransactionDirty();
  const nextItemIdRef = useRef((initialValues?.items.length ?? 0) + 1);
  const merchantFieldRef = useRef<HTMLDivElement>(null);
  const accountFieldRef = useRef<HTMLDivElement>(null);
  const itemsFieldRef = useRef<HTMLDivElement>(null);
  const isFirstRenderRef = useRef(true);
  const [selectedType, setSelectedType] = useState<TransactionType>(
    initialValues?.type ?? initialType ?? "expense",
  );
  const [selectedAccountId, setSelectedAccountId] = useState(
    initialValues?.accountId ?? "",
  );
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
  const [pickerReimbursementItemIds, setPickerReimbursementItemIds] = useState<
    string[]
  >([]);
  const [pickerRefundCandidates, setPickerRefundCandidates] = useState<
    TransactionRefundCandidate[]
  >([]);
  const [pickerErrors, setPickerErrors] = useState<TransactionPickerErrors>({});
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
      setPickerReimbursementItemIds([]);
      setPickerRefundCandidates([]);
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
  const expenseTotal = itemsByType.expense.reduce((sum, item) => {
    if (!isValidMoneyText(item.amount)) return sum;
    return sum + Number(item.amount);
  }, 0);
  const incomeTotal = itemsByType.income.reduce((sum, item) => {
    if (!isValidMoneyText(item.amount)) return sum;
    return sum + Number(item.amount);
  }, 0);
  const hasValidItems =
    allDisplayItems.length > 0 &&
    allDisplayItems.every(
      (item) =>
        item.categoryId.length > 0 &&
        isValidMoneyText(item.amount) &&
        ((item.refundCandidates?.length ?? 0) === 0 ||
          allocateRefundAmount(item.amount, item.refundCandidates ?? []) !==
            null),
    );
  const transactionAtValue = composeTransactionDateTimeLocalValue(
    transactionDate,
    transactionTime,
  );
  const isSubmitDisabled =
    accountOptions.length === 0 ||
    merchantOptions.length === 0 ||
    allNormalCategoryOptions.length === 0 ||
    !transactionAtValue;

  useEffect(() => {
    onSubmitDisabledChange?.(isSubmitDisabled);
  }, [isSubmitDisabled, onSubmitDisabledChange]);

  const signedTotalAmount =
    allDisplayItems.length > 0
      ? formatNetAmount(incomeTotal - expenseTotal)
      : "未填写金额";
  const businessExpenseTotal = itemsByType.expense.reduce(
    (sum, item) => sum + getFormItemBusinessAmount(item),
    0,
  );
  const businessIncomeTotal = itemsByType.income.reduce(
    (sum, item) => sum + getFormItemBusinessAmount(item),
    0,
  );
  const hasBusinessNetAmount = allDisplayItems.some(
    (item) =>
      item.businessNetAmount !== undefined &&
      Number(item.businessNetAmount) !== Number(item.amount),
  );
  const businessTotalAmount = hasBusinessNetAmount
    ? formatNetAmount(businessIncomeTotal - businessExpenseTotal)
    : null;

  function addItem(
    categoryId: string,
    amount: string,
    specialStatus: TransactionFormItem["specialStatus"],
    reimbursementItemIds: string[],
    refundCandidates: TransactionRefundCandidate[],
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
            reimbursementItemIds,
            refundCandidates,
          ),
          businessStatus: getFormItemBusinessStatus(
            specialStatus,
            reimbursementItemIds,
            pickerRefundCandidates,
          ),
          categoryId,
          id: itemId,
          refundCandidates,
          reimbursementItemIds,
          specialStatus,
        },
      ],
    }));
    if (fieldErrors.items) {
      setFieldErrors((current) => ({ ...current, items: undefined }));
    }
  }

  function updateItem(
    itemId: number,
    values: Partial<Omit<TransactionFormItem, "id">>,
  ) {
    markEditDirty?.();
    setItemsByType((current) => ({
      expense: current.expense.map((item) =>
        item.id === itemId ? { ...item, ...values } : item,
      ),
      income: current.income.map((item) =>
        item.id === itemId ? { ...item, ...values } : item,
      ),
    }));
  }

  function replaceItem(
    itemId: number,
    categoryId: string,
    amount: string,
    specialStatus: TransactionFormItem["specialStatus"],
    reimbursementItemIds: string[],
    refundCandidates: TransactionRefundCandidate[],
  ) {
    markEditDirty?.();
    const categoryType = categoryById.get(categoryId)?.type ?? selectedType;
    const businessStatus = getFormItemBusinessStatus(
      specialStatus,
      reimbursementItemIds,
      pickerRefundCandidates,
    );

    setItemsByType((current) => {
      const inExpense = current.expense.some((item) => item.id === itemId);
      const sourceType: TransactionType = inExpense ? "expense" : "income";

      if (sourceType === categoryType) {
        return {
          ...current,
          [categoryType]: current[categoryType].map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  amount,
                  businessNetAmount: getNewItemBusinessNetAmount(
                    reimbursementItemIds,
                    refundCandidates,
                  ),
                  businessStatus,
                  categoryId,
                  refundCandidates,
                  reimbursementItemIds,
                  specialStatus,
                }
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
        {
          ...existingItem,
          amount,
          businessNetAmount: getNewItemBusinessNetAmount(
            reimbursementItemIds,
            refundCandidates,
          ),
          businessStatus,
          categoryId,
          refundCandidates,
          reimbursementItemIds,
          specialStatus,
        },
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
      setPickerReimbursementItemIds([]);
      setPickerRefundCandidates([]);
      setPickerErrors({});
    }
  }

  function openSheet() {
    setEditingItemId(null);
    setPickerCategoryId("");
    setPickerAmount("");
    setPickerSpecialStatus(null);
    setPickerReimbursementItemIds([]);
    setPickerRefundCandidates([]);
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
    setPickerReimbursementItemIds(item.reimbursementItemIds ?? []);
    setPickerRefundCandidates(item.refundCandidates ?? []);
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
      setPickerReimbursementItemIds([]);
      setPickerRefundCandidates([]);
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
    if (!isValidMoneyText(pickerAmount)) {
      errors.amount = transactionFormValidationMessages.amountInvalid;
    } else if (
      pickerRefundCandidates.length > 0 &&
      allocateRefundAmount(pickerAmount, pickerRefundCandidates) === null
    ) {
      errors.amount = "退款金额无法按所选明细有效分摊，请调整金额或选择。";
    }

    if (Object.keys(errors).length > 0) {
      setPickerErrors(errors);
      return false;
    }

    setPickerErrors({});
    if (editingItemId === null) {
      addItem(
        pickerCategoryId,
        pickerAmount,
        pickerSpecialStatus,
        pickerReimbursementItemIds,
        pickerRefundCandidates,
      );
    } else {
      replaceItem(
        editingItemId,
        pickerCategoryId,
        pickerAmount,
        pickerSpecialStatus,
        pickerReimbursementItemIds,
        pickerRefundCandidates,
      );
    }
    setEditingItemId(null);
    setPickerCategoryId("");
    setPickerAmount("");
    setPickerSpecialStatus(null);
    setPickerReimbursementItemIds([]);
    setPickerRefundCandidates([]);
    return true;
  }

  function handleMerchantChange(merchantId: string) {
    markEditDirty?.();
    setSelectedMerchantId(merchantId);
    if (fieldErrors.merchant) {
      setFieldErrors((current) => ({ ...current, merchant: undefined }));
    }
  }

  function handleAccountChange(accountId: string) {
    markEditDirty?.();
    setSelectedAccountId(accountId);
    setItemsByType((current) => ({
      ...current,
      income: current.income.map((item) =>
        item.refundCandidates?.some(
          (candidate) => candidate.accountId !== accountId,
        )
          ? {
              ...item,
              businessStatus: getFormItemBusinessStatus(
                item.specialStatus,
                item.reimbursementItemIds ?? [],
                [],
              ),
              refundCandidates: [],
            }
          : item,
      ),
    }));
    if (
      pickerRefundCandidates.some(
        (candidate) => candidate.accountId !== accountId,
      )
    ) {
      setPickerRefundCandidates([]);
      setLinkNotice("账户已变更，请重新选择退款明细。");
    }
    if (fieldErrors.account) {
      setFieldErrors((current) => ({ ...current, account: undefined }));
    }
  }

  function handleNoteChange() {
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
    if (!selectedAccountId) {
      errors.account = transactionFormValidationMessages.accountRequired;
    }
    if (!hasValidItems) {
      errors.items = transactionFormValidationMessages.itemsRequired;
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
    accountFieldRef,
    allNormalCategoryOptions,
    categoryGroups,
    closeSheet,
    editingItemId,
    fieldErrors,
    handleAccountChange,
    handleDateChange,
    handleMerchantChange,
    handleNoteChange,
    handlePickerAdd,
    handlePickerAmountChange,
    handlePickerCategoryToggle,
    handlePickerGroupSelect,
    handleSubmit,
    handleTimeChange,
    isSheetOpen,
    isSubmitDisabled,
    linkNotice,
    itemSummaries,
    itemsFieldRef,
    merchantFieldRef,
    openItemSheet,
    openSheet,
    pickerAmount,
    pickerCategoryId,
    pickerErrors,
    pickerRefundCandidates,
    pickerReimbursementItemIds,
    pickerSpecialStatus,
    removeItem,
    businessTotalAmount,
    selectedAccount,
    selectedAccountId,
    selectedCategoryGroup,
    selectedMerchant,
    selectedMerchantId,
    selectedType,
    setPickerSpecialStatus,
    setPickerRefundCandidates: (candidates: TransactionRefundCandidate[]) => {
      if (
        candidates.some(
          (candidate) => candidate.accountId !== selectedAccountId,
        )
      ) {
        setPickerRefundCandidates([]);
        setLinkNotice("退款明细必须与收款账户一致，请重新选择。");
        return;
      }
      setPickerRefundCandidates(candidates);
      if (candidates.length > 0) setPickerReimbursementItemIds([]);
      setLinkNotice(null);
    },
    setPickerReimbursementItemIds: (ids: string[]) => {
      setPickerReimbursementItemIds(ids);
      if (ids.length > 0) setPickerRefundCandidates([]);
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
    });
  });

  return result;
}

function getFormItemBusinessStatus(
  specialStatus: TransactionFormItem["specialStatus"],
  reimbursementItemIds: string[],
  refundCandidates: TransactionRefundCandidate[],
): TransactionBusinessStatus | null {
  if (refundCandidates.length > 0) return "refund";
  if (reimbursementItemIds.length > 0) return "reimbursement";
  return specialStatus ?? null;
}

function cancelDefaultEvent(event: { preventDefault(): void }) {
  event.preventDefault();
}

function formatNetAmount(net: number) {
  const value = parseFloat(net.toFixed(2));
  if (value === 0) return "0";
  return value > 0 ? `+${value}` : `${value}`;
}

function getFormItemBusinessAmount(item: TransactionFormItem) {
  const amount = Number(item.businessNetAmount ?? item.amount);
  return Number.isFinite(amount) ? amount : 0;
}

function getNewItemBusinessNetAmount(
  reimbursementItemIds: string[],
  refundCandidates: TransactionRefundCandidate[],
) {
  return reimbursementItemIds.length > 0 || refundCandidates.length > 0
    ? "0"
    : undefined;
}
