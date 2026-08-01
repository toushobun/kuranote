"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { useEditTransactionDirty } from "organisms/transactions/EditTransactionDirtyContext/EditTransactionDirtyContext";
import type {
  TransactionCategoryOption,
  TransactionType,
} from "types/transactions";
import { transactionFormValidationMessages } from "utils/transactionMessages";
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
  const [pickerErrors, setPickerErrors] = useState<TransactionPickerErrors>({});
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
    if (item.specialStatus === "excluded") return sum;
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
      (item) => item.categoryId.length > 0 && isValidMoneyText(item.amount),
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

  function addItem(
    categoryId: string,
    amount: string,
    specialStatus: TransactionFormItem["specialStatus"],
  ) {
    markEditDirty?.();
    const categoryType = categoryById.get(categoryId)?.type ?? selectedType;
    const itemId = nextItemIdRef.current;
    nextItemIdRef.current += 1;
    setItemsByType((current) => ({
      ...current,
      [categoryType]: [
        ...current[categoryType],
        { amount, categoryId, id: itemId, specialStatus },
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
  ) {
    markEditDirty?.();
    const categoryType = categoryById.get(categoryId)?.type ?? selectedType;

    setItemsByType((current) => {
      const inExpense = current.expense.some((item) => item.id === itemId);
      const sourceType: TransactionType = inExpense ? "expense" : "income";

      if (sourceType === categoryType) {
        return {
          ...current,
          [categoryType]: current[categoryType].map((item) =>
            item.id === itemId
              ? { ...item, amount, categoryId, specialStatus }
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
        { ...existingItem, amount, categoryId, specialStatus },
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
      setPickerErrors({});
    }
  }

  function openSheet() {
    setEditingItemId(null);
    setPickerCategoryId("");
    setPickerAmount("");
    setPickerSpecialStatus(null);
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
    }

    if (Object.keys(errors).length > 0) {
      setPickerErrors(errors);
      return false;
    }

    setPickerErrors({});
    if (editingItemId === null) {
      addItem(pickerCategoryId, pickerAmount, pickerSpecialStatus);
    } else {
      replaceItem(
        editingItemId,
        pickerCategoryId,
        pickerAmount,
        pickerSpecialStatus,
      );
    }
    setEditingItemId(null);
    setPickerCategoryId("");
    setPickerAmount("");
    setPickerSpecialStatus(null);
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
    itemSummaries,
    itemsFieldRef,
    merchantFieldRef,
    openItemSheet,
    openSheet,
    pickerAmount,
    pickerCategoryId,
    pickerErrors,
    pickerSpecialStatus,
    removeItem,
    selectedAccount,
    selectedAccountId,
    selectedCategoryGroup,
    selectedMerchant,
    selectedMerchantId,
    selectedType,
    setPickerSpecialStatus,
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
    result[categoryType].push({ ...item, id: index + 1 });
  });

  return result;
}

function cancelDefaultEvent(event: { preventDefault(): void }) {
  event.preventDefault();
}

function formatNetAmount(net: number) {
  const value = parseFloat(net.toFixed(2));
  if (value === 0) return "0";
  return value > 0 ? `+${value}` : `${value}`;
}
