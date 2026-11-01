"use server";

import { redirect } from "next/navigation";

import {
  accountResultValues,
  accountsResultHref,
  createdIdParams,
  withQueryParam,
} from "config/paths";
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
import { getSafeNextPath } from "lib/navigation/safeNextPath";
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

  let accountId: string;
  try {
    const service = await getAccountService();
    ({ accountId } = await service.create({
      ...parsed.value,
      ledgerId: currentLedger.id,
      userId,
    }));
    revalidateAccountMutation();
    if (formData.get("presentation") === "dialog") {
      const accounts = await service.listTransactionOptionsWithHolders({
        ledgerId: currentLedger.id,
        userId,
      });
      const createdAccount = accounts.find(
        (account) => account.id === accountId,
      );
      return createdAccount
        ? { createdAccount }
        : getValidationErrorState(accountErrorCodes.createFailed);
    }
  } catch (error) {
    return getActionErrorState(error, accountErrorCodes.createFailed);
  }

  // 从记一笔等页面进入时，新增成功后带着新账户 ID 返回来源页面。
  const returnTo = getSafeNextPath(formData.get("returnTo"));
  redirect(
    returnTo
      ? withQueryParam(returnTo, createdIdParams.account, accountId)
      : accountsResultHref(accountResultValues.created),
  );
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
