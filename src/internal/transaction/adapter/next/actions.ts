"use server";

import { redirect } from "next/navigation";

import {
  transactionResultValues,
  transactionsMonthHref,
  transactionsResultHref,
} from "config/paths";
import { createRequestContainer } from "internal/container";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import { revalidateTransactionMutation } from "internal/transaction/adapter/next/revalidate";
import {
  validateConvertTransactionTypeForm,
  validateTransactionForm,
  validateUpdateTransactionForm,
  validateUpdateTransferTransactionForm,
  validateVoidTransactionForm,
} from "internal/transaction/schema";
import type { TransactionActionState } from "types/transactions";
import {
  getEditTransactionErrorMessage,
  getNewTransactionErrorMessage,
  getTransactionErrorMessage,
} from "utils/pageErrors";

async function getTransactionService() {
  const dependencies = await createServerRequestDependencies();
  return createRequestContainer(dependencies).transaction.service;
}

function errorState(message: string): TransactionActionState {
  return { error: message };
}

function appErrorState(error: unknown, fallback: string) {
  if (error instanceof AppError) return errorState(error.message);
  console.error("[transaction] transaction action failed unexpectedly", {
    errorName: error instanceof Error ? error.name : "unknown",
  });
  return errorState(fallback);
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
    return errorState(
      getNewTransactionErrorMessage(validation.error) ??
        "交易内容不正确，请确认后重试。",
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
    return appErrorState(error, "交易新增失败，请稍后重试。");
  }

  revalidateTransactionMutation();
  redirect(createdHref(values.transactionAt));
}

export async function updateTransaction(
  _previousState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const { currentLedger } = await requireCurrentUserAndLedger();
  const validation = validateUpdateTransactionForm(formData);
  if (!validation.ok) {
    return errorState(
      getEditTransactionErrorMessage(validation.error) ??
        "交易内容不正确，请确认后重试。",
    );
  }
  try {
    await (
      await getTransactionService()
    ).updateNormal({ ledgerId: currentLedger.id, ...validation.value });
  } catch (error) {
    return appErrorState(error, "交易更新失败，请稍后重试。");
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
    return errorState(
      getEditTransactionErrorMessage(validation.error) ??
        "转账内容不正确，请确认后重试。",
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
    return appErrorState(error, "转账更新失败，请稍后重试。");
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
    return errorState(
      getEditTransactionErrorMessage(validation.error) ??
        "交易类型转换内容不正确，请确认后重试。",
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
        tagNames: values.tagNames,
        targetType: values.targetType,
        transactionAt: values.transactionAt,
        transactionRecordId: values.transactionRecordId,
      });
    }
  } catch (error) {
    return appErrorState(error, "交易类型转换失败，请稍后重试。");
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
    return errorState("交易类型指定不正确，请刷新页面后重试。");
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
    return errorState(
      getTransactionErrorMessage(validation.error) ??
        "交易指定不正确，请刷新页面后重试。",
    );
  }
  try {
    await (
      await getTransactionService()
    ).void({ ledgerId: currentLedger.id, ...validation.value });
  } catch (error) {
    return appErrorState(error, "交易删除失败，请稍后重试。");
  }
  revalidateTransactionMutation();
  redirect(transactionsResultHref(transactionResultValues.deleted));
}
