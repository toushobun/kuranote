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
  accountErrorMessages,
  type AccountErrorCode,
} from "internal/account/errors";
import { createRequestContainer } from "internal/container";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { createErrorState } from "internal/shared/adapter/next/actionState";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import type { AccountActionState } from "types/accounts";

async function getAccountService() {
  const dependencies = await createServerRequestDependencies();
  return createRequestContainer(dependencies).account.service;
}

function getValidationErrorState(code: AccountErrorCode): AccountActionState {
  return createErrorState(accountErrorMessages[code]);
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
  return createErrorState(accountErrorMessages[fallbackCode]);
}

export async function createAccount(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  const parsed = parseCreateAccountForm(formData);
  if (!parsed.ok) {
    return getValidationErrorState(parsed.error);
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
    return getValidationErrorState(parsed.error);
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
    return getValidationErrorState(parsed.error);
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
