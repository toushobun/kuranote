"use server";

import { redirect } from "next/navigation";

import {
  accountResultValues,
  accountsErrorHref,
  accountsResultHref,
} from "config/paths";
import {
  parseArchiveAccountForm,
  parseCreateAccountForm,
  parseUpdateAccountForm,
} from "server/account/adapter/next/formParser";
import { revalidateAccountMutation } from "server/account/adapter/next/revalidate";
import { accountErrorCodes, isAccountErrorCode } from "server/account/errors";
import { createRequestContainer } from "server/container";
import { requireCurrentUserAndLedger } from "server/context/currentLedger";
import { createServerRequestDependencies } from "server/shared/context/createServerRequestDependencies";
import { AppError } from "server/shared/errors/appError";

async function getAccountService() {
  const dependencies = await createServerRequestDependencies();
  return createRequestContainer(dependencies).account.service;
}

function getActionErrorCode(error: unknown, fallback: string): string {
  if (error instanceof AppError && isAccountErrorCode(error.code)) {
    return error.code;
  }

  console.error("[account] account action failed unexpectedly", {
    errorName: error instanceof Error ? error.name : "unknown",
  });
  return fallback;
}

export async function createAccount(formData: FormData): Promise<never> {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  const parsed = parseCreateAccountForm(formData);
  if (!parsed.ok) redirect(accountsErrorHref(parsed.error));

  try {
    await (await getAccountService()).create({
      ...parsed.value,
      ledgerId: currentLedger.id,
      userId,
    });
  } catch (error) {
    redirect(
      accountsErrorHref(
        getActionErrorCode(error, accountErrorCodes.createFailed),
      ),
    );
  }

  revalidateAccountMutation();
  redirect(accountsResultHref(accountResultValues.created));
}

export async function updateAccount(formData: FormData): Promise<never> {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  const parsed = parseUpdateAccountForm(formData);
  if (!parsed.ok) redirect(accountsErrorHref(parsed.error));

  try {
    await (await getAccountService()).update({
      ...parsed.value,
      ledgerId: currentLedger.id,
      userId,
    });
  } catch (error) {
    redirect(
      accountsErrorHref(
        getActionErrorCode(error, accountErrorCodes.updateFailed),
      ),
    );
  }

  revalidateAccountMutation();
  redirect(accountsResultHref(accountResultValues.updated));
}

export async function archiveAccount(formData: FormData): Promise<never> {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  const parsed = parseArchiveAccountForm(formData);
  if (!parsed.ok) redirect(accountsErrorHref(parsed.error));

  try {
    await (await getAccountService()).archive({
      accountId: parsed.value.accountId,
      ledgerId: currentLedger.id,
      userId,
    });
  } catch (error) {
    redirect(
      accountsErrorHref(
        getActionErrorCode(error, accountErrorCodes.archiveFailed),
      ),
    );
  }

  revalidateAccountMutation();
  redirect(accountsResultHref(accountResultValues.archived));
}
