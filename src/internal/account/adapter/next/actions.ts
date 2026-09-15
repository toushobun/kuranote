"use server";

import { redirect } from "next/navigation";

import { accountResultValues, accountsResultHref } from "config/paths";
import {
  parseArchiveAccountForm,
  parseCreateAccountForm,
  parseUpdateAccountForm,
} from "internal/account/adapter/next/formParser";
import { revalidateAccountMutation } from "internal/account/adapter/next/revalidate";
import {
  accountErrorCodes,
  getAccountErrorMessage,
  type AccountErrorCode,
} from "internal/account/errors";
import { createRequestContainer } from "internal/container";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import type { AccountActionState } from "types/accounts";

async function getAccountService() {
  const dependencies = await createServerRequestDependencies();
  return createRequestContainer(dependencies).account.service;
}

function createErrorState(message: string): AccountActionState {
  return { error: message, errorKey: crypto.randomUUID() };
}

function getValidationErrorState(
  code: string,
  fallback: string,
): AccountActionState {
  return createErrorState(getAccountErrorMessage(code) ?? fallback);
}

function getActionErrorState(
  error: unknown,
  fallbackCode: AccountErrorCode,
): AccountActionState {
  if (error instanceof AppError) {
    return createErrorState(error.message);
  }

  console.error("[account] account action failed unexpectedly", {
    errorName: error instanceof Error ? error.name : "unknown",
  });
  return createErrorState(
    getAccountErrorMessage(fallbackCode) ?? "账户操作失败，请稍后重试。",
  );
}

export async function createAccount(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  const parsed = parseCreateAccountForm(formData);
  if (!parsed.ok) {
    return getValidationErrorState(
      parsed.error,
      "账户信息不正确，请确认后重试。",
    );
  }

  try {
    await (
      await getAccountService()
    ).create({
      ...parsed.value,
      ledgerId: currentLedger.id,
      userId,
    });
  } catch (error) {
    return getActionErrorState(error, accountErrorCodes.createFailed);
  }

  revalidateAccountMutation();
  redirect(accountsResultHref(accountResultValues.created));
}

export async function updateAccount(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  const parsed = parseUpdateAccountForm(formData);
  if (!parsed.ok) {
    return getValidationErrorState(
      parsed.error,
      "账户信息不正确，请确认后重试。",
    );
  }

  try {
    await (
      await getAccountService()
    ).update({
      ...parsed.value,
      ledgerId: currentLedger.id,
      userId,
    });
  } catch (error) {
    return getActionErrorState(error, accountErrorCodes.updateFailed);
  }

  revalidateAccountMutation();
  redirect(accountsResultHref(accountResultValues.updated));
}

export async function archiveAccount(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  const parsed = parseArchiveAccountForm(formData);
  if (!parsed.ok) {
    return getValidationErrorState(
      parsed.error,
      "账户指定不正确，请刷新页面后重试。",
    );
  }

  try {
    await (
      await getAccountService()
    ).archive({
      accountId: parsed.value.accountId,
      ledgerId: currentLedger.id,
      userId,
    });
  } catch (error) {
    return getActionErrorState(error, accountErrorCodes.archiveFailed);
  }

  revalidateAccountMutation();
  redirect(accountsResultHref(accountResultValues.archived));
}
