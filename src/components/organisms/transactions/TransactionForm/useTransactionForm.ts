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
import {
  resolveTransactionBusinessStatus,
  formatRefundMinorUnits,
  summarizeRefundAllocationAmounts,
  summarizeReimbursementAllocationAmounts,
  toRefundMinorUnits,
} from "internal/transaction";
import {
  composeTransactionDateTimeLocalValue,
  formatDateTimeLocalInputValue,
  getNowDateTimeLocalValue,
  hasBusinessNetAmountOffset,
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
  const [pickerRefundCandidate, setPickerRefundCandidate] =
    useState<TransactionRefundCandidate | null>(null);
  const [pickerReimbursementCandidate, setPickerReimbursementCandidate] =
    useState<TransactionRefundCandidate | null>(null);
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
        (!item.refundCandidate || Number(item.amount) > 0),
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
  const hasBusinessNetAmount = allDisplayItems.some((item) =>
    hasBusinessNetAmountOffset(item.amount, item.businessNetAmount),
  );
  const businessTotalAmount = hasBusinessNetAmount
    ? formatNetAmount(businessIncomeTotal - businessExpenseTotal)
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
    if (!isValidMoneyText(pickerAmount)) {
      errors.amount = transactionFormValidationMessages.amountInvalid;
    } else if (pickerRefundCandidate && Number(pickerAmount) <= 0) {
      errors.amount = "退款金额必须大于 0。";
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
        pickerRefundCandidate,
        pickerReimbursementCandidate,
      );
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

  function handleAccountChange(accountId: string) {
    markEditDirty?.();
    setSelectedAccountId(accountId);
    const nextAccount = accountOptions.find(
      (account) => account.id === accountId,
    );
    setItemsByType((current) => ({
      ...current,
      income: current.income.map((item) => {
        const hasInvalidRefundCandidate = Boolean(
          item.refundCandidate && item.refundCandidate.accountId !== accountId,
        );
        const hasInvalidReimbursementCandidate = Boolean(
          item.reimbursementCandidate &&
          item.reimbursementCandidate.accountCurrency !== nextAccount?.currency,
        );
        if (!hasInvalidRefundCandidate && !hasInvalidReimbursementCandidate) {
          return item;
        }

        const refundCandidate = hasInvalidRefundCandidate
          ? null
          : (item.refundCandidate ?? null);
        const reimbursementCandidate = hasInvalidReimbursementCandidate
          ? null
          : (item.reimbursementCandidate ?? null);
        return {
          ...item,
          businessStatus: getFormItemBusinessStatus(
            item.specialStatus,
            refundCandidate,
            reimbursementCandidate,
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

    let nextNotice: string | null = null;
    if (
      pickerRefundCandidate &&
      pickerRefundCandidate.accountId !== accountId
    ) {
      setPickerRefundCandidate(null);
      nextNotice = "账户已变更，请重新选择退款明细。";
    }
    if (
      pickerReimbursementCandidate &&
      pickerReimbursementCandidate.accountCurrency !== nextAccount?.currency
    ) {
      setPickerReimbursementCandidate(null);
      nextNotice = "账户币种已变更，请重新选择报销明细。";
    }
    setLinkNotice(nextNotice);

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
    pickerRefundCandidate,
    pickerReimbursementCandidate,
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
    setPickerRefundCandidate: (
      candidate: TransactionRefundCandidate | null,
    ) => {
      if (candidate && candidate.accountId !== selectedAccountId) {
        setPickerRefundCandidate(null);
        setLinkNotice("退款明细必须与收款账户一致，请重新选择。");
        return;
      }
      setPickerRefundCandidate(candidate);
      if (candidate) setPickerReimbursementCandidate(null);
      setLinkNotice(null);
    },
    setPickerReimbursementCandidate: (
      candidate: TransactionRefundCandidate | null,
    ) => {
      if (
        candidate &&
        candidate.accountCurrency !== selectedAccount?.currency
      ) {
        setPickerReimbursementCandidate(null);
        setLinkNotice("报销明细必须与收款账户币种一致，请重新选择。");
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
    });
  });

  return result;
}

function getFormItemBusinessStatus(
  specialStatus: TransactionFormItem["specialStatus"],
  refundCandidate: TransactionRefundCandidate | null,
  reimbursementCandidate: TransactionRefundCandidate | null,
): TransactionBusinessStatus | null {
  return resolveTransactionBusinessStatus({
    isRefundIncome: Boolean(refundCandidate),
    isReimbursementIncome: Boolean(reimbursementCandidate),
    specialStatus,
  });
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
  if (item.specialStatus === "reimbursed") {
    return "0";
  }

  const amountUnits = toRefundMinorUnits(item.amount);
  const refundedAmountUnits = toRefundMinorUnits(item.refundedAmount ?? "0");
  if (
    amountUnits === null ||
    refundedAmountUnits === null ||
    refundedAmountUnits <= BigInt(0)
  ) {
    return undefined;
  }

  return formatRefundMinorUnits(
    amountUnits > refundedAmountUnits
      ? amountUnits - refundedAmountUnits
      : BigInt(0),
  );
}

function withUpdatedItemBusinessNetAmount(
  item: TransactionFormItem,
  categoryType?: TransactionType,
) {
  return {
    ...item,
    businessNetAmount: getUpdatedItemBusinessNetAmount(item, categoryType),
  };
}
