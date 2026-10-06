"use server";

import { redirect } from "next/navigation";

import {
  transactionResultValues,
  transactionsMonthHref,
  transactionsResultHref,
} from "config/paths";
import { createRequestContainer } from "internal/container";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { createErrorState } from "internal/shared/adapter/next/actionState";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import {
  parseLinkedEditActionInput,
  validateLinkedEditTransactionForm,
} from "internal/transaction/adapter/next/linkedEditInput";
import { revalidateTransactionMutation } from "internal/transaction/adapter/next/revalidate";
import {
  balanceAdjustmentErrorMessages,
  toTransactionActionErrorCode,
  transactionActionErrorMessages,
  transactionLinkedEditErrorMessages,
  transactionValidationErrorMessages,
  updateTransactionValidationErrorMessages,
  voidTransactionValidationErrorMessages,
} from "internal/transaction/errors";
import {
  validateConvertTransactionTypeForm,
  validateTransactionForm,
  validateUpdateTransferTransactionForm,
  validateVoidTransactionForm,
  parseUpdateBalanceAdjustmentForm,
} from "internal/transaction/schema";
import type { TransactionActionState } from "types/transactions";

async function getTransactionContainer() {
  const dependencies = await createServerRequestDependencies();
  return createRequestContainer(dependencies).transaction;
}

async function getTransactionService() {
  return (await getTransactionContainer()).service;
}

async function getLinkedTransactionEditService() {
  return (await getTransactionContainer()).linkedTransactionEditService;
}

function appErrorState(
  error: unknown,
  fallback: string,
): TransactionActionState {
  if (error instanceof AppError) {
    const errorCode = toTransactionActionErrorCode(error.code);
    return errorCode
      ? { ...createErrorState(error.message), errorCode }
      : createErrorState(error.message);
  }
  console.error("[transaction] transaction action failed unexpectedly", {
    errorName: error instanceof Error ? error.name : "unknown",
  });
  return createErrorState(fallback);
}

function createdHref(transactionAt: string) {
  return transactionsMonthHref(
    transactionAt.slice(0, 7),
    transactionResultValues.created,
  );
}

function updatedHref(transactionAt: string) {
  return transactionsMonthHref(
    transactionAt.slice(0, 7),
    transactionResultValues.updated,
  );
}

export async function createTransaction(
  _previousState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const { currentLedger } = await requireCurrentUserAndLedger();
  const validation = validateTransactionForm(formData);
  if (!validation.ok) {
    return createErrorState(
      transactionValidationErrorMessages[validation.error],
    );
  }

  const values = validation.value;
  try {
    const service = await getTransactionService();
    if (values.type === "transfer") {
      await service.createTransfer({
        accountId: values.accountId,
        ledgerId: currentLedger.id,
        note: values.note,
        transactionAt: values.transactionAt,
        transferAmount: values.transferAmount,
        transferTargetAccountId: values.transferTargetAccountId,
      });
    } else {
      await service.createNormal({ ledgerId: currentLedger.id, ...values });
    }
  } catch (error) {
    return appErrorState(error, transactionActionErrorMessages.createFailed);
  }

  revalidateTransactionMutation();
  redirect(createdHref(values.transactionAt));
}

export async function updateTransaction(
  _previousState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const { currentLedger } = await requireCurrentUserAndLedger();
  const validation = validateLinkedEditTransactionForm(formData);
  if (!validation.ok) {
    return createErrorState(
      updateTransactionValidationErrorMessages[validation.error],
    );
  }
  const linkedEditInput = parseLinkedEditActionInput(
    formData,
    validation.value.items.map((item) => item.id),
  );
  if (!linkedEditInput) {
    return createErrorState(transactionLinkedEditErrorMessages.inputInvalid);
  }
  try {
    await (
      await getLinkedTransactionEditService()
    ).updateNormal(currentLedger, {
      ledgerId: currentLedger.id,
      ...validation.value,
      ...linkedEditInput,
    });
  } catch (error) {
    return appErrorState(error, transactionActionErrorMessages.updateFailed);
  }
  revalidateTransactionMutation();
  redirect(updatedHref(validation.value.transactionAt));
}

export async function updateTransferTransaction(
  _previousState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const { currentLedger } = await requireCurrentUserAndLedger();
  const validation = validateUpdateTransferTransactionForm(formData);
  if (!validation.ok) {
    return createErrorState(
      updateTransactionValidationErrorMessages[validation.error],
    );
  }
  try {
    const values = validation.value;
    await (
      await getTransactionService()
    ).updateTransfer({
      accountId: values.accountId,
      ledgerId: currentLedger.id,
      note: values.note,
      transactionAt: values.transactionAt,
      transactionRecordId: values.transactionRecordId,
      transferAmount: values.transferAmount,
      transferTargetAccountId: values.transferTargetAccountId,
    });
  } catch (error) {
    return appErrorState(
      error,
      transactionActionErrorMessages.transferUpdateFailed,
    );
  }
  revalidateTransactionMutation();
  redirect(updatedHref(validation.value.transactionAt));
}

export async function convertTransactionType(
  _previousState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const { currentLedger } = await requireCurrentUserAndLedger();
  const validation = validateConvertTransactionTypeForm(formData);
  if (!validation.ok) {
    return createErrorState(
      updateTransactionValidationErrorMessages[validation.error],
    );
  }
  try {
    const values = validation.value;
    const service = await getTransactionService();
    if (values.targetType === "transfer") {
      await service.convert({
        accountId: values.accountId,
        ledgerId: currentLedger.id,
        note: values.note,
        targetType: "transfer",
        transactionAt: values.transactionAt,
        transactionRecordId: values.transactionRecordId,
        transferAmount: values.transferAmount,
        transferTargetAccountId: values.transferTargetAccountId,
      });
    } else {
      await service.convert({
        accountId: values.accountId,
        items: values.items,
        ledgerId: currentLedger.id,
        merchantId: values.merchantId,
        note: values.note,
        targetType: values.targetType,
        transactionAt: values.transactionAt,
        transactionRecordId: values.transactionRecordId,
      });
    }
  } catch (error) {
    return appErrorState(error, transactionActionErrorMessages.convertFailed);
  }
  revalidateTransactionMutation();
  redirect(updatedHref(validation.value.transactionAt));
}

export async function saveEditTransaction(
  previousState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const sourceType = String(formData.get("sourceType") ?? "").trim();
  const targetType = String(
    formData.get("targetType") ?? formData.get("type") ?? "",
  ).trim();
  const validTypes = new Set(["expense", "income", "transfer"]);
  if (!validTypes.has(sourceType) || !validTypes.has(targetType)) {
    return createErrorState(transactionActionErrorMessages.typeInvalid);
  }
  if (
    sourceType === targetType ||
    (sourceType !== "transfer" && targetType !== "transfer")
  ) {
    return targetType === "transfer"
      ? updateTransferTransaction(previousState, formData)
      : updateTransaction(previousState, formData);
  }
  return convertTransactionType(previousState, formData);
}

export async function voidTransaction(
  _previousState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const { currentLedger } = await requireCurrentUserAndLedger();
  const validation = validateVoidTransactionForm(formData);
  if (!validation.ok) {
    return createErrorState(
      voidTransactionValidationErrorMessages[validation.error],
    );
  }
  try {
    await (
      await getLinkedTransactionEditService()
    ).void(currentLedger, { ledgerId: currentLedger.id, ...validation.value });
  } catch (error) {
    return appErrorState(error, transactionActionErrorMessages.voidFailed);
  }
  revalidateTransactionMutation();
  redirect(transactionsResultHref(transactionResultValues.deleted));
}

export async function updateBalanceAdjustmentTransaction(
  _previousState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const { currentLedger } = await requireCurrentUserAndLedger();
  const parsed = parseUpdateBalanceAdjustmentForm(formData);
  if (!parsed.success) return createErrorState(parsed.error.issues[0].message);
  try {
    await (
      await getTransactionService()
    ).updateBalanceAdjustment({ ledgerId: currentLedger.id, ...parsed.data });
  } catch (error) {
    return appErrorState(error, balanceAdjustmentErrorMessages.updateFailed);
  }
  revalidateTransactionMutation();
  redirect(updatedHref(parsed.data.transactionAt));
}
