"use client";
import {
  adjustLinkCandidate,
  getLinkCandidateDefaultAmount,
} from "internal/transaction";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { useDirtySnapshot } from "molecules/ui/UnsavedChangesDialog/useDirtySnapshot";

import { useEditTransactionDirty } from "organisms/transactions/EditTransactionDirtyContext/EditTransactionDirtyContext";
import type {
  TransactionAccountOption,
  TransactionBusinessStatus,
  TransactionCategoryOption,
  TransactionMerchantOption,
  TransactionRefundCandidate,
  TransactionType,
} from "types/transactions";
import {
  transactionFormValidationMessages,
  type TransactionLinkKind,
} from "utils/transactionMessages";
import {
  resolveTransactionBusinessStatus,
  formatRefundMinorUnits,
  summarizeRefundAllocationAmounts,
  summarizeReimbursementAllocationAmounts,
  toRefundMinorUnits,
  transactionPaymentValidationErrorMessages,
  getMultiAccountItemType,
  validateTransactionPayments,
} from "internal/transaction";
import {
  composeTransactionDateTimeLocalValue,
  formatDateTimeLocalInputValue,
  getNowDateTimeLocalValue,
  splitDateTimeLocalValue,
} from "utils/transactions";

import {
  reconcileTransactionPayments,
  useTransactionPaymentFields,
} from "../TransactionPaymentFields/useTransactionPaymentFields";
import type {
  TransactionFormInitialValues,
  TransactionFormItem,
  TransactionItemSummary,
  TransactionPickerErrors,
} from "./TransactionForm.types";
import { useTransactionOffsetEntry } from "../TransactionOffsetEntry/TransactionOffsetEntry";
import { offsetEntryCandidates } from "../TransactionOffsetEntry/offsetEntryDraft";
import { shouldFollowLinkedField } from "./linkedFieldAutoFill";
import { useLinkExchangeRates } from "./useLinkExchangeRates";
import { previewCrossCurrencyLink } from "./crossCurrencyLinkPreview";
import { prefillTransferTargetAmount } from "../TransferReceipt/transferCurrency";
import {
  buildCategoryPickerGroups,
  getDefaultPickerCategory,
  getFirstEnabledCategoryId,
  getMissingIncomeLinkKind,
  isValidMoneyText,
  isValidTransactionFormItem,
} from "./TransactionForm.utils";

type UseTransactionFormOptions = {
  accountOptions: TransactionAccountOption[];
  categoryOptions: TransactionCategoryOption[];
  merchantOptions: TransactionMerchantOption[];
  initialValues: TransactionFormInitialValues;
  onPickerItemCommit?: (itemId: number) => void;
};

export function useTransactionForm({
  accountOptions,
  categoryOptions,
  initialValues,
  merchantOptions,
  onPickerItemCommit,
}: UseTransactionFormOptions) {
  const offsetEntry = useTransactionOffsetEntry();
  const initialOffsetCandidates = offsetEntry
    ? offsetEntryCandidates(offsetEntry)
    : [];
  const initialOffsetPicker =
    initialOffsetCandidates.length > 1 ? initialOffsetCandidates[0] : null;
  const reportEditDirty = useEditTransactionDirty();
  const nextItemIdRef = useRef(initialValues.items.length + 1);
  // 初始明细在 createInitialItemsByType 中按 1..N 编号，新增明细从 N+1 起编号。
  const isInitialItem = (itemId: number) =>
    !offsetEntry && itemId <= initialValues.items.length;
  const selectedType: TransactionType = initialValues.type;
  const paymentFields = useTransactionPaymentFields(initialValues.payments);
  const selectedAccountId = paymentFields.primaryAccountId;
  const [selectedMerchantId, setSelectedMerchantId] = useState(
    initialValues.merchantId,
  );
  const [linkMerchantTouched, setLinkMerchantTouched] = useState(false);
  // 按明细记录曾自动带出的字段；空对象表示已确定但从未自动带出。
  const autoLinkedFields = useRef(
    new Map<number, { merchantId?: true; accountId?: true }>(),
  );
  const [itemsByType, setItemsByType] = useState<
    Record<TransactionType, TransactionFormItem[]>
  >(() =>
    createInitialItemsByType(
      initialValues,
      new Map(categoryOptions.map((category) => [category.id, category])),
    ),
  );
  const [isSheetOpen, setIsSheetOpen] = useState(
    !!initialOffsetPicker && !!initialValues.merchantId,
  );
  const [pickerSessionKey, setPickerSessionKey] = useState(0);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [selectedCategoryGroupId, setSelectedCategoryGroupId] = useState("");
  const [pickerCategoryId, setPickerCategoryId] = useState(
    offsetEntry
      ? (categoryOptions.find((c) => c.systemKey === offsetEntry.kind)?.id ??
          "")
      : "",
  );
  const [pickerAmount, setPickerAmount] = useState(
    initialOffsetPicker
      ? getLinkCandidateDefaultAmount(initialOffsetPicker)
      : "",
  );
  const [pickerMode, setPickerMode] = useState<
    "expense" | "income" | "refund" | "reimbursement"
  >(offsetEntry?.kind ?? "expense");
  const [pickerSpecialStatus, setPickerSpecialStatus] =
    useState<TransactionFormItem["specialStatus"]>(null);
  const [pickerRefundCandidate, setPickerRefundCandidate] =
    useState<TransactionRefundCandidate | null>(
      offsetEntry?.kind === "refund" ? initialOffsetPicker : null,
    );
  const [pickerReimbursementCandidate, setPickerReimbursementCandidate] =
    useState<TransactionRefundCandidate | null>(
      offsetEntry?.kind === "reimbursement" ? initialOffsetPicker : null,
    );
  const [pickerErrors, setPickerErrors] = useState<TransactionPickerErrors>({});
  const [note, setNote] = useState(initialValues.note);
  const [transactionDate, setTransactionDate] = useState("");
  const [transactionTime, setTransactionTime] = useState("");
  const [timeZoneOffsetMinutes, setTimeZoneOffsetMinutes] = useState("");

  const [waitingOffsetMerchant, setWaitingOffsetMerchant] = useState(
    !!initialOffsetPicker && !initialValues.merchantId,
  );
  const allDisplayItems = [...itemsByType.expense, ...itemsByType.income];

  useEffect(() => {
    const localValue = initialValues.transactionAt
      ? formatDateTimeLocalInputValue(initialValues.transactionAt)
      : getNowDateTimeLocalValue();
    const nextDateTime = splitDateTimeLocalValue(localValue);

    // eslint-disable-next-line react-hooks/set-state-in-effect -- 客户端挂载后同步本地时区时间，避免服务端水合差异。
    setTransactionDate(nextDateTime.date);
    setTransactionTime(nextDateTime.time);
    setTimeZoneOffsetMinutes(String(new Date().getTimezoneOffset()));
  }, [initialValues.transactionAt]);

  const allNormalCategoryOptions = useMemo(
    () =>
      categoryOptions.filter(
        (category) =>
          !category.systemKey &&
          (category.type === "expense" || category.type === "income"),
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
  const linkRates = useLinkExchangeRates(
    selectedAccount?.currency,
    transactionDate,
    [
      ...allDisplayItems.map(
        (item) =>
          (item.refundCandidate ?? item.reimbursementCandidate)
            ?.accountCurrency ?? "",
      ),
      pickerRefundCandidate?.accountCurrency ?? "",
      pickerReimbursementCandidate?.accountCurrency ?? "",
    ],
  );
  const incomeCurrency = selectedAccount?.currency;
  const originalAccountCurrency = accountOptions.find(
    (account) => account.id === initialValues.payments[0]?.accountId,
  )?.currency;
  const originalLocalDateTime = initialValues.transactionAt
    ? formatDateTimeLocalInputValue(initialValues.transactionAt)
    : "";
  const originalDateTime = splitDateTimeLocalValue(originalLocalDateTime);
  const recordConversionInputsChanged =
    !!initialValues.transactionRecordId &&
    (incomeCurrency !== originalAccountCurrency ||
      (transactionDate && originalDateTime.date !== transactionDate) ||
      (transactionTime && originalDateTime.time !== transactionTime));
  const pickerTarget = pickerRefundCandidate ?? pickerReimbursementCandidate;
  const pickerLinkIsCrossCurrency = !!(
    pickerTarget &&
    incomeCurrency &&
    pickerTarget.accountCurrency !== incomeCurrency
  );
  const pickerLinkRate = pickerTarget
    ? linkRates.getRate(pickerTarget.accountCurrency)
    : null;
  const pickerRatePending = pickerLinkIsCrossCurrency && linkRates.isLoading;
  const pickerRateMissing = pickerLinkIsCrossCurrency && !pickerLinkRate;

  const convertForTarget = (amount: string, targetCurrency: string) => {
    if (!incomeCurrency || incomeCurrency === targetCurrency) return amount;
    const rate = linkRates.getRate(targetCurrency);
    if (!rate) return "0";
    return amount === "0"
      ? "0"
      : prefillTransferTargetAmount(
          amount,
          incomeCurrency,
          targetCurrency,
          rate.rate,
        ) || "0";
  };
  const itemSummaries: TransactionItemSummary[] = allDisplayItems.map(
    (item, index) => {
      const category = categoryById.get(item.categoryId);
      const target = item.refundCandidate ?? item.reimbursementCandidate;
      if (!target || category?.type !== "income") return { ...item, category };

      const originalIndex = item.persistedId
        ? initialValues.items.findIndex(
            (entry) => entry.id === item.persistedId,
          )
        : -1;
      const original = initialValues.items[originalIndex];
      const linksToTarget = (
        entry: Pick<
          TransactionFormItem,
          "refundCandidate" | "reimbursementCandidate"
        >,
      ) =>
        entry.refundCandidate?.id === target.id ||
        entry.reimbursementCandidate?.id === target.id;
      const earlierItems = allDisplayItems
        .slice(0, index)
        .filter(linksToTarget)
        .map((entry) => ({
          ...entry,
          amount: convertForTarget(entry.amount, target.accountCurrency),
        }));
      const originalEarlierItems = initialValues.items
        .slice(0, Math.max(0, originalIndex))
        .filter(linksToTarget);
      const rawEarlierItems = allDisplayItems
        .slice(0, index)
        .filter(linksToTarget);
      const unchanged =
        !recordConversionInputsChanged &&
        original?.amount === item.amount &&
        linksToTarget(original) &&
        rawEarlierItems.length === originalEarlierItems.length &&
        rawEarlierItems.every(
          (earlier, i) =>
            earlier.persistedId === originalEarlierItems[i]?.id &&
            earlier.amount === originalEarlierItems[i]?.amount,
        );
      const available = unchanged
        ? null
        : adjustLinkCandidate(
            target,
            earlierItems,
            initialValues.items.map((entry) => ({
              ...entry,
              amount: convertForTarget(entry.amount, target.accountCurrency),
            })),
          );
      const remaining =
        available?.remainingRefundableAmount ??
        target.remainingRefundableAmount;
      const crossCurrency =
        !!incomeCurrency && target.accountCurrency !== incomeCurrency;
      const rate = crossCurrency
        ? linkRates.getRate(target.accountCurrency)
        : null;
      const saved =
        crossCurrency && unchanged ? (item.savedLinkAllocation ?? null) : null;
      const calculated =
        crossCurrency && rate && !saved
          ? previewCrossCurrencyLink({
              amount: item.amount,
              incomeCurrency,
              targetCurrency: target.accountCurrency,
              remainingAmount: remaining,
              rate: rate.rate,
            })
          : null;
      const preview = saved
        ? { ...saved, businessNetAmount: original?.businessNetAmount ?? "0" }
        : calculated && rate && incomeCurrency
          ? {
              ...calculated,
              incomeCurrency,
              targetCurrency: target.accountCurrency,
              rate: rate.rate,
              rateDate: rate.rateDate,
            }
          : undefined;
      return {
        ...item,
        category,
        linkPreview: preview,
        businessNetAmount:
          available === null && original
            ? (original.businessNetAmount ?? original.amount)
            : crossCurrency
              ? preview?.businessNetAmount
              : summarizeRefundAllocationAmounts(item.amount, remaining)
                  ?.netIncomeAmount,
      };
    },
  );
  const multiAccountItemType = getMultiAccountItemType(
    itemSummaries.map(({ category }) => ({
      categoryType: category?.type ?? null,
    })),
  );
  const hasMixedPaymentItems =
    itemsByType.expense.length > 0 && itemsByType.income.length > 0;
  const isIncomePayment =
    (multiAccountItemType ??
      (allDisplayItems.length === 0 ? selectedType : null)) === "income";
  const disabledCategoryType =
    paymentFields.isMultiAccount && multiAccountItemType
      ? multiAccountItemType === "income"
        ? ("expense" as const)
        : ("income" as const)
      : undefined;
  const editingPickerItem = allDisplayItems.find(
    (item) => item.id === editingItemId,
  );
  const pickerModeLocked = Boolean(
    editingPickerItem?.persistedId &&
    ["refund", "reimbursement"].includes(
      categoryById.get(editingPickerItem.categoryId)?.systemKey ?? "",
    ),
  );
  const pickerSpecialStatusLocked = Boolean(
    editingPickerItem?.specialStatusLocked,
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
    allDisplayItems.every(
      (item) =>
        isValidTransactionFormItem(item, selectedAccount?.currency) &&
        !getMissingIncomeLinkKind({
          ...item,
          category: categoryById.get(item.categoryId),
        }),
    ) &&
    !itemSummaries.some(
      (item) =>
        (item.refundCandidate || item.reimbursementCandidate) &&
        item.category?.type === "income" &&
        !!incomeCurrency &&
        (item.refundCandidate ?? item.reimbursementCandidate)
          ?.accountCurrency !== incomeCurrency &&
        !linkRates.getRate(
          (item.refundCandidate ?? item.reimbursementCandidate)
            ?.accountCurrency ?? "",
        ),
    );
  const transactionAtValue = composeTransactionDateTimeLocalValue(
    transactionDate,
    transactionTime,
  );
  const dirtySnapshot = JSON.stringify([
    selectedType,
    selectedMerchantId,
    allDisplayItems.map((item) => [
      item.categoryId,
      item.amount,
      item.specialStatus,
      item.refundCandidate?.id ?? null,
      item.reimbursementCandidate?.id ?? null,
    ]),
    paymentFields.payments.map((payment) => [
      payment.accountId,
      payment.amount,
    ]),
    note,
    transactionAtValue,
  ]);
  useDirtySnapshot(dirtySnapshot, reportEditDirty, Boolean(transactionAtValue));

  function addItem(
    categoryId: string,
    amount: string,
    specialStatus: TransactionFormItem["specialStatus"],
    refundCandidate: TransactionRefundCandidate | null,
    reimbursementCandidate: TransactionRefundCandidate | null,
  ) {
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
            incomeCurrency,
            linkRates.getRate,
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
    return itemId;
  }

  function updateItem(
    itemId: number,
    values: Partial<Omit<TransactionFormItem, "id">>,
  ) {
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
          incomeCurrency,
          linkRates.getRate,
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
                  incomeCurrency,
                  linkRates.getRate,
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
          incomeCurrency,
          linkRates.getRate,
        ),
      ];

      return moved;
    });
  }

  function removeItem(itemId: number) {
    autoLinkedFields.current.delete(itemId);
    setItemsByType((current) => ({
      expense: current.expense.filter((item) => item.id !== itemId),
      income: current.income.filter((item) => item.id !== itemId),
    }));
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
    setWaitingOffsetMerchant(false);
    setPickerSessionKey((key) => key + 1);
    const { groupId, categoryId } = getDefaultPickerCategory(
      categoryGroups,
      disabledCategoryType,
    );
    setEditingItemId(null);
    setPickerCategoryId(
      offsetEntry
        ? (categoryOptions.find((c) => c.systemKey === offsetEntry.kind)?.id ??
            "")
        : categoryId,
    );
    setPickerMode(
      offsetEntry?.kind ?? categoryById.get(categoryId)?.type ?? "expense",
    );
    setPickerAmount("");
    setPickerSpecialStatus(null);
    setPickerRefundCandidate(null);
    setPickerReimbursementCandidate(null);
    setPickerErrors({});
    setSelectedCategoryGroupId(groupId);
    setIsSheetOpen(true);
  }

  function openItemSheet(itemId: number) {
    const item = allDisplayItems.find(
      (currentItem) => currentItem.id === itemId,
    );
    if (!item) return;
    setPickerSessionKey((key) => key + 1);

    const categoryGroup = categoryGroups.find((group) =>
      group.categories.some((category) => category.id === item.categoryId),
    );

    setEditingItemId(itemId);
    setPickerCategoryId(item.categoryId);
    const category = categoryById.get(item.categoryId);
    setPickerMode(
      category?.systemKey === "refund" ||
        category?.systemKey === "reimbursement"
        ? category.systemKey
        : (category?.type ?? "expense"),
    );
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

  /** 选中小分类时清掉与其收支类型不符的附加信息。 */
  function clearPickerExtrasForCategory(categoryId: string) {
    const categoryType = categoryById.get(categoryId)?.type;
    if (categoryType === "income") {
      setPickerSpecialStatus(null);
    } else if (categoryType === "expense") {
      setPickerRefundCandidate(null);
      setPickerReimbursementCandidate(null);
    }
  }

  /**
   * 切换大分类（#1046）：传入 categoryId 时选中它，否则选中该大分类里
   * 第一个可用的小分类。
   */
  function handlePickerGroupSelect(groupId: string, categoryId?: string) {
    const nextCategoryId =
      categoryId ??
      getFirstEnabledCategoryId(
        categoryGroups.find((group) => group.id === groupId),
        disabledCategoryType,
      );
    setSelectedCategoryGroupId(groupId);
    setPickerCategoryId(nextCategoryId);
    clearPickerExtrasForCategory(nextCategoryId);
    setPickerErrors({});
  }

  function handlePickerCategoryToggle(categoryId: string) {
    setPickerCategoryId((current) =>
      current === categoryId ? "" : categoryId,
    );
    clearPickerExtrasForCategory(categoryId);
    if (pickerErrors.category) {
      setPickerErrors((current) => ({ ...current, category: undefined }));
    }
  }

  function handlePickerModeChange(
    nextMode: "expense" | "income" | "refund" | "reimbursement",
  ) {
    if (
      pickerModeLocked ||
      (paymentFields.isMultiAccount && nextMode !== "expense") ||
      (disabledCategoryType === "income" && nextMode !== "expense") ||
      (disabledCategoryType === "expense" && nextMode === "expense")
    )
      return;

    const nextSystem = categoryOptions.find(
      (category) => category.systemKey === nextMode,
    );
    const nextGroup = categoryGroups.find(
      (group) => group.categories[0]?.type === nextMode,
    );
    const nextCategoryId =
      nextMode === "refund" || nextMode === "reimbursement"
        ? (nextSystem?.id ?? "")
        : (nextGroup?.categories[0]?.id ?? "");

    setPickerMode(nextMode);
    setPickerCategoryId(nextCategoryId);
    setSelectedCategoryGroupId(nextGroup?.id ?? "");
    setPickerSpecialStatus(null);
    setPickerRefundCandidate(null);
    setPickerReimbursementCandidate(null);
    setPickerErrors({});
  }

  function handlePickerAdd() {
    const errors: TransactionPickerErrors = {};
    const selectedTarget =
      pickerMode === "refund"
        ? pickerRefundCandidate
        : pickerMode === "reimbursement"
          ? pickerReimbursementCandidate
          : null;
    if (
      (pickerMode === "refund" || pickerMode === "reimbursement") &&
      (!selectedTarget || pickerRateMissing)
    ) {
      return false;
    }
    if (!pickerCategoryId) {
      errors.category = transactionFormValidationMessages.categoryRequired;
    }

    if (Object.keys(errors).length > 0) {
      setPickerErrors(errors);
      return false;
    }

    setPickerErrors({});
    let committedItemId = editingItemId;
    // 退款 / 报销选定目标但未输入金额时，确认即保存 0（待定金额）。
    const amountToSave =
      selectedTarget && !pickerAmount.trim() ? "0" : pickerAmount;
    if (editingItemId === null) {
      const itemId = addItem(
        pickerCategoryId,
        amountToSave,
        pickerSpecialStatus,
        pickerRefundCandidate,
        pickerReimbursementCandidate,
      );
      committedItemId = itemId;
      if (pickerMode !== "refund" && pickerMode !== "reimbursement") {
        onPickerItemCommit?.(itemId);
      }
    } else {
      replaceItem(
        editingItemId,
        pickerCategoryId,
        amountToSave,
        pickerSpecialStatus,
        pickerRefundCandidate,
        pickerReimbursementCandidate,
      );
    }
    // 编辑已有明细时，只有金额还空着才通知（打开金额键盘）。
    if (editingItemId !== null && !amountToSave.trim())
      onPickerItemCommit?.(editingItemId);
    // 仅在关联明细确实写入小票后，才自动补全商家与收款账户。
    // 选择器内点选、改选或取消都只改草稿，不影响小票。
    // 编辑成普通明细后，该行不再是最初自动补全商家/账户的来源。
    if (editingItemId !== null && !selectedTarget) {
      autoLinkedFields.current.delete(editingItemId);
    }
    if (selectedTarget && committedItemId !== null) {
      const tracked = autoLinkedFields.current.get(committedItemId) ?? {};
      const firstCommit = !autoLinkedFields.current.has(committedItemId);
      const originalTarget =
        editingPickerItem?.refundCandidate ??
        editingPickerItem?.reimbursementCandidate;
      const retargeted =
        editingItemId !== null &&
        originalTarget != null &&
        originalTarget.id !== selectedTarget.id;
      // 首次新增关联或首次改选初始加载的明细时，保留原有空字段自动补全规则。
      // 新增明细一旦确定，即使没有带出过字段，后续也不能取得跟随资格。
      const canFirstAutoFill =
        firstCommit &&
        (!originalTarget || (isInitialItem(committedItemId) && retargeted));
      const nextMerchantId = selectedTarget.merchantId;
      const nextAccountId = selectedTarget.accountId;
      const canWriteMerchant =
        nextMerchantId &&
        merchantOptions.some((merchant) => merchant.id === nextMerchantId);
      const canWriteAccount =
        nextAccountId &&
        accountOptions.some((account) => account.id === nextAccountId);
      if (
        canWriteMerchant &&
        shouldFollowLinkedField(
          selectedMerchantId,
          tracked.merchantId,
          retargeted,
          canFirstAutoFill,
        )
      ) {
        setSelectedMerchantId(nextMerchantId);
        setLinkMerchantTouched(true);
        tracked.merchantId = true;
      }
      if (
        canWriteAccount &&
        shouldFollowLinkedField(
          selectedAccountId,
          tracked.accountId,
          retargeted,
          canFirstAutoFill,
        )
      ) {
        const primaryPayment = paymentFields.payments[0];
        if (primaryPayment) {
          handlePrimaryAccountChange(primaryPayment.key, nextAccountId);
          tracked.accountId = true;
        }
      }
      autoLinkedFields.current.set(committedItemId, tracked);
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
    setSelectedMerchantId(merchantId);
    if (waitingOffsetMerchant && merchantId) {
      setWaitingOffsetMerchant(false);
      setIsSheetOpen(true);
    }
  }

  function handlePaymentAccountChange(key: number, accountId: string) {
    if (key !== paymentFields.payments[0]?.key) {
      paymentFields.changeAccount(key, accountId);
      return;
    }
    handlePrimaryAccountChange(key, accountId);
  }

  function handlePaymentAmountChange(key: number, amount: string) {
    paymentFields.changeAmount(key, amount);
  }

  function addPayment(accountId?: string) {
    if (hasMixedPaymentItems) return false;

    // 首行预填明细合计（没有明细时为 0），新增行为 0。
    paymentFields.addPayment(paymentReconciliation.itemTotal, accountId);
    return true;
  }

  function handleRemovePayment(key: number) {
    paymentFields.removePayment(key, selectedAccount?.currency);
  }

  // 切换账户只改变本次记录币种；已关联的原支出始终保留，汇率预览随之刷新。
  function handlePrimaryAccountChange(key: number, accountId: string) {
    paymentFields.changeAccount(key, accountId);
  }

  function resolveLinkCandidate(candidate: TransactionRefundCandidate) {
    const targetCurrency = candidate.accountCurrency;
    return adjustLinkCandidate(
      candidate,
      itemsByType.income.map((item) => ({
        ...item,
        amount: convertForTarget(item.amount, targetCurrency),
      })),
      offsetEntry
        ? []
        : initialValues.items.map((item) => ({
            ...item,
            amount: convertForTarget(item.amount, targetCurrency),
          })),
      editingItemId,
    );
  }

  function selectLinkCandidate(
    kind: TransactionLinkKind,
    candidate: TransactionRefundCandidate | null,
  ) {
    if (kind === "refund") {
      setPickerRefundCandidate(candidate);
      if (candidate) setPickerReimbursementCandidate(null);
    } else {
      setPickerReimbursementCandidate(candidate);
      if (candidate) setPickerRefundCandidate(null);
    }
    if (candidate && pickerMode === kind) {
      setPickerAmount(
        (() => {
          const remaining = getLinkCandidateDefaultAmount(
            resolveLinkCandidate(candidate),
          );
          if (
            !remaining ||
            !incomeCurrency ||
            candidate.accountCurrency === incomeCurrency
          )
            return remaining;
          const rate = linkRates.getRate(candidate.accountCurrency);
          return rate
            ? prefillTransferTargetAmount(
                remaining,
                candidate.accountCurrency,
                incomeCurrency,
                1 / rate.rate,
              )
            : "";
        })(),
      );
    }
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
  }

  function handleDateChange(date: string) {
    setTransactionDate(date);
  }

  function handleTimeChange(time: string) {
    setTransactionTime(time);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (
      !transactionAtValue ||
      !selectedMerchantId ||
      !hasValidItems ||
      getAccountFieldError()
    ) {
      cancelDefaultEvent(event);
    }
  }

  const linkAffectedItems = [...initialValues.items, ...itemsByType.income];
  const lockedLinkAmounts = new Map<string, string>();
  for (const item of itemsByType.income) {
    if (item.id === editingItemId) continue;
    const candidate = item.refundCandidate ?? item.reimbursementCandidate;
    if (!candidate) continue;
    const existing =
      toRefundMinorUnits(lockedLinkAmounts.get(candidate.id) ?? "0") ??
      BigInt(0);
    const amount = toRefundMinorUnits(item.amount) ?? BigInt(0);
    lockedLinkAmounts.set(
      candidate.id,
      formatRefundMinorUnits(existing + amount),
    );
  }
  return {
    note,
    addItem,
    accountFieldError: getAccountFieldError(),
    allNormalCategoryOptions,
    categoryGroups,
    closeSheet,
    editingItemId,
    addPayment,
    handleDateChange,
    handleMerchantChange,
    handleNoteChange,
    handlePickerAdd,
    handlePickerCategoryToggle,
    handlePickerGroupSelect,
    handlePickerModeChange,
    handlePaymentAccountChange,
    handlePaymentAmountChange,
    handleRemovePayment,
    handleSubmit,
    handleTimeChange,
    isMultiAccount: paymentFields.isMultiAccount,
    disabledCategoryType,
    hasMixedPaymentItems,
    isIncomePayment,
    isSheetOpen,
    linkMerchantTouched,
    itemSummaries,
    openItemSheet,
    openSheet,
    paymentReconciliation,
    payments: paymentFields.payments,
    pickerAmount,
    pickerMode,
    pickerModeLocked,
    pickerSessionKey,
    pickerCategoryId,
    pickerErrors,
    pickerRefundCandidate,
    pickerReimbursementCandidate,
    pickerLinkRate,
    pickerRatePending,
    pickerRateMissing,
    linkAffectedCandidates: collectLinkAffectedCandidates(
      linkAffectedItems,
      "refund",
    ),
    linkAffectedReimbursementCandidates: collectLinkAffectedCandidates(
      linkAffectedItems,
      "reimbursement",
    ),
    resolveLinkCandidate,
    lockedLinkAmounts,
    pickerSpecialStatus,
    pickerSpecialStatusLocked,
    removeItem,
    expenseTotal,
    incomeTotal,
    selectedAccount,
    selectedCategoryGroup,
    selectedMerchant,
    selectedMerchantId,
    selectedType,
    setPickerAmount,
    setPickerSpecialStatus,
    setPickerRefundCandidate: (candidate: TransactionRefundCandidate | null) =>
      selectLinkCandidate("refund", candidate),
    setPickerReimbursementCandidate: (
      candidate: TransactionRefundCandidate | null,
    ) => selectLinkCandidate("reimbursement", candidate),
    timeZoneOffsetMinutes,
    transactionAtValue,
    transactionDate,
    transactionTime,
    updateItem,
  };
}

function createInitialItemsByType(
  initialValues: TransactionFormInitialValues,
  categoryById: Map<string, TransactionCategoryOption>,
): Record<TransactionType, TransactionFormItem[]> {
  const result: Record<TransactionType, TransactionFormItem[]> = {
    expense: [],
    income: [],
  };

  initialValues.items.forEach((item, index) => {
    const categoryType =
      categoryById.get(item.categoryId)?.type ?? initialValues.type;
    result[categoryType].push({
      ...item,
      id: index + 1,
      persistedId: item.id,
      specialStatusLocked: Boolean(item.specialStatus),
    });
  });

  return result;
}

/** 报销只展示本来有报销关联的草稿候选，避免把其他退款候选误加进报销列表。 */
function collectLinkAffectedCandidates(
  items: readonly {
    refundCandidate?: TransactionRefundCandidate | null;
    reimbursementCandidate?: TransactionRefundCandidate | null;
  }[],
  kind: TransactionLinkKind,
) {
  const unique = new Map<string, TransactionRefundCandidate>();
  for (const item of items) {
    const candidates =
      kind === "refund"
        ? [item.refundCandidate, item.reimbursementCandidate]
        : [item.reimbursementCandidate];
    for (const candidate of candidates) {
      if (candidate) unique.set(candidate.id, candidate);
    }
  }
  return [...unique.values()];
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
  incomeCurrency?: string,
  getRate?: (
    targetCurrency: string,
  ) => { rate: number; rateDate: string } | null,
) {
  if (specialStatus === "reimbursed") return "0";
  const candidate = reimbursementCandidate ?? refundCandidate;
  if (
    candidate &&
    incomeCurrency &&
    candidate.accountCurrency !== incomeCurrency
  ) {
    const rate = getRate?.(candidate.accountCurrency);
    return rate
      ? previewCrossCurrencyLink({
          amount,
          incomeCurrency,
          targetCurrency: candidate.accountCurrency,
          remainingAmount: candidate.remainingRefundableAmount,
          rate: rate.rate,
        })?.businessNetAmount
      : undefined;
  }
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
  incomeCurrency?: string,
  getRate?: (
    targetCurrency: string,
  ) => { rate: number; rateDate: string } | null,
) {
  if (categoryType === "income") {
    return getNewItemBusinessNetAmount(
      item.amount,
      item.specialStatus,
      item.refundCandidate ?? null,
      item.reimbursementCandidate ?? null,
      incomeCurrency,
      getRate,
    );
  }
  const amountUnits = toRefundMinorUnits(item.amount);
  const refundedUnits =
    toRefundMinorUnits(item.refundedAmount ?? "0") ?? BigInt(0);
  const reimbursedUnits =
    toRefundMinorUnits(item.reimbursementAmount ?? "0") ?? BigInt(0);
  if (amountUnits !== null && refundedUnits + reimbursedUnits > BigInt(0)) {
    const remaining = amountUnits - refundedUnits - reimbursedUnits;
    return formatRefundMinorUnits(
      remaining > BigInt(0) ? remaining : BigInt(0),
    );
  }
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

  const remaining = businessNetAmountUnits + amountUnits - previousAmountUnits;
  return formatRefundMinorUnits(remaining > BigInt(0) ? remaining : BigInt(0));
}

function withUpdatedItemBusinessNetAmount(
  item: TransactionFormItem,
  previousAmount: string,
  categoryType?: TransactionType,
  incomeCurrency?: string,
  getRate?: (
    targetCurrency: string,
  ) => { rate: number; rateDate: string } | null,
) {
  return {
    ...item,
    businessNetAmount: getUpdatedItemBusinessNetAmount(
      item,
      previousAmount,
      categoryType,
      incomeCurrency,
      getRate,
    ),
  };
}
