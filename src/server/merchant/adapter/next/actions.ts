"use server";

import { redirect } from "next/navigation";

import { merchantsErrorHref, routePaths } from "config/paths";
import { requireCurrentUserAndLedger } from "server/ledger/adapter/next/currentLedger";
import { createRequestContainer } from "server/container";
import { revalidateMerchantMutation } from "server/merchant/adapter/next/revalidate";
import {
  isMerchantPageErrorCode,
  merchantErrorCodes,
  type MerchantPageErrorCode,
} from "server/merchant/errors";
import {
  validateArchiveMerchantAliasForm,
  validateArchiveMerchantForm,
  validateCreateMerchantAliasForm,
  validateCreateMerchantForm,
  validateUpdateMerchantForm,
} from "server/merchant/schema";
import { createServerRequestDependencies } from "server/shared/context/createServerRequestDependencies";
import { AppError } from "server/shared/errors/appError";

async function getMerchantService() {
  const dependencies = await createServerRequestDependencies();
  return createRequestContainer(dependencies).merchant.service;
}

function merchantIdFromDetails(details: unknown): string | null {
  if (typeof details !== "object" || details === null) return null;
  const merchantId = (details as Record<string, unknown>).merchantId;
  return typeof merchantId === "string" && merchantId.length > 0
    ? merchantId
    : null;
}

function redirectForMerchantError(
  error: unknown,
  fallback: MerchantPageErrorCode,
  merchantId?: string | null,
): never {
  if (!(error instanceof AppError)) throw error;

  const pageError = isMerchantPageErrorCode(error.code) ? error.code : fallback;
  redirect(
    merchantsErrorHref(
      pageError,
      merchantId ?? merchantIdFromDetails(error.details),
    ),
  );
}

export async function createMerchant(formData: FormData) {
  const { currentLedger } = await requireCurrentUserAndLedger();
  const validation = validateCreateMerchantForm(formData);
  if (!validation.ok) redirect(merchantsErrorHref(validation.error));

  try {
    await (
      await getMerchantService()
    ).createMerchant({
      ledgerId: currentLedger.id,
      ...validation.value,
    });
  } catch (error) {
    redirectForMerchantError(error, merchantErrorCodes.createFailed);
  }

  revalidateMerchantMutation();
  redirect(routePaths.merchants);
}

export async function updateMerchant(formData: FormData) {
  const { currentLedger } = await requireCurrentUserAndLedger();
  const validation = validateUpdateMerchantForm(formData);
  if (!validation.ok) {
    redirect(merchantsErrorHref(validation.error, validation.merchantId));
  }

  try {
    await (
      await getMerchantService()
    ).updateMerchant({
      ledgerId: currentLedger.id,
      ...validation.value,
    });
  } catch (error) {
    redirectForMerchantError(
      error,
      merchantErrorCodes.updateFailed,
      validation.value.merchantId,
    );
  }

  revalidateMerchantMutation();
  redirect(routePaths.merchants);
}

export async function archiveMerchant(formData: FormData) {
  const { currentLedger } = await requireCurrentUserAndLedger();
  const validation = validateArchiveMerchantForm(formData);
  if (!validation.ok) redirect(merchantsErrorHref(validation.error));

  try {
    await (
      await getMerchantService()
    ).archiveMerchant({
      ledgerId: currentLedger.id,
      merchantId: validation.value.merchantId,
    });
  } catch (error) {
    redirectForMerchantError(
      error,
      merchantErrorCodes.archiveFailed,
      validation.value.merchantId,
    );
  }

  revalidateMerchantMutation();
  redirect(routePaths.merchants);
}

export async function createMerchantAlias(formData: FormData) {
  const { currentLedger } = await requireCurrentUserAndLedger();
  const validation = validateCreateMerchantAliasForm(formData);
  if (!validation.ok) {
    redirect(merchantsErrorHref(validation.error, validation.merchantId));
  }

  try {
    await (
      await getMerchantService()
    ).createAlias({
      ledgerId: currentLedger.id,
      ...validation.value,
    });
  } catch (error) {
    redirectForMerchantError(
      error,
      merchantErrorCodes.aliasCreateFailed,
      validation.value.merchantId,
    );
  }

  revalidateMerchantMutation();
  redirect(routePaths.merchants);
}

export async function archiveMerchantAlias(formData: FormData) {
  const { currentLedger } = await requireCurrentUserAndLedger();
  const validation = validateArchiveMerchantAliasForm(formData);
  if (!validation.ok) redirect(merchantsErrorHref(validation.error));

  try {
    await (
      await getMerchantService()
    ).archiveAlias({
      aliasId: validation.value.aliasId,
      ledgerId: currentLedger.id,
    });
  } catch (error) {
    redirectForMerchantError(error, merchantErrorCodes.aliasArchiveFailed);
  }

  revalidateMerchantMutation();
  redirect(routePaths.merchants);
}
