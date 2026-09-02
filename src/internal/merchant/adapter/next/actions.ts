"use server";

import { redirect } from "next/navigation";

import { merchantEditHref, routePaths } from "config/paths";
import { merchantText } from "config/merchantText";
import { createRequestContainer } from "internal/container";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { revalidateMerchantMutation } from "internal/merchant/adapter/next/revalidate";
import {
  getMerchantActionErrorMessage,
  isMerchantActionErrorCode,
  merchantErrorCodes,
  type MerchantErrorCode,
} from "internal/merchant/errors";
import {
  validateArchiveMerchantAliasForm,
  validateArchiveMerchantForm,
  validateArchiveMerchantTagForm,
  validateCreateMerchantAliasForm,
  validateCreateMerchantForm,
  validateCreateMerchantTagForm,
  validateFetchMerchantIconForm,
  validateReorderMerchantTagsForm,
  validateSetPreferredMerchantAliasForm,
  validateUpdateMerchantForm,
  validateUpdateMerchantTagForm,
} from "internal/merchant/schema";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import type {
  MerchantActionState,
  MerchantIconStateAction,
  MerchantStateAction,
  MerchantTagReorderAction,
  MerchantTagStateAction,
} from "types/merchants";

async function getMerchantService() {
  const dependencies = await createServerRequestDependencies();
  return createRequestContainer(dependencies).merchant.service;
}

function createErrorState(message: string): MerchantActionState {
  return { error: message, errorKey: crypto.randomUUID() };
}

function validationErrorState(error: MerchantErrorCode): MerchantActionState {
  return createErrorState(
    getMerchantActionErrorMessage(error) ??
      "商家操作内容不正确，请确认后重试。",
  );
}

function actionErrorState(
  error: unknown,
  fallback: MerchantErrorCode,
  action: string,
): MerchantActionState {
  if (error instanceof AppError && isMerchantActionErrorCode(error.code)) {
    return createErrorState(error.message);
  }

  console.error(`[merchant] ${action} action failed unexpectedly`, {
    errorName: error instanceof Error ? error.name : "unknown",
  });
  return createErrorState(
    getMerchantActionErrorMessage(fallback) ?? "商家操作失败，请稍后重试。",
  );
}

export const createMerchant: MerchantStateAction =
  async function createMerchant(_previousState, formData) {
    const { currentLedger } = await requireCurrentUserAndLedger();
    const validation = validateCreateMerchantForm(formData);
    if (!validation.ok) return validationErrorState(validation.error);

    try {
      await (
        await getMerchantService()
      ).createMerchant({
        ledgerId: currentLedger.id,
        ...validation.value,
      });
    } catch (error) {
      return actionErrorState(error, merchantErrorCodes.createFailed, "create");
    }

    revalidateMerchantMutation();
    redirect(routePaths.merchants);
  };

export const fetchMerchantIcon: MerchantIconStateAction =
  async function fetchMerchantIcon(_previousState, formData) {
    const { currentLedger } = await requireCurrentUserAndLedger();
    const validation = validateFetchMerchantIconForm(formData);
    if (!validation.ok) return validationErrorState(validation.error);

    try {
      const service = await getMerchantService();
      const icon = validation.value.merchantId
        ? await service.cacheMerchantIcon({
            ledgerId: currentLedger.id,
            merchantId: validation.value.merchantId,
            websiteUrl: validation.value.websiteUrl,
          })
        : await service.fetchMerchantIcon({
            ledgerId: currentLedger.id,
            websiteUrl: validation.value.websiteUrl,
          });
      if (validation.value.merchantId) revalidateMerchantMutation();
      return {
        iconUrl: icon.url,
        success: validation.value.merchantId
          ? merchantText.iconSuccess
          : merchantText.iconPreviewSuccess,
      };
    } catch (error) {
      return actionErrorState(
        error,
        merchantErrorCodes.merchantIconFetchFailed,
        "fetch icon",
      );
    }
  };

export const updateMerchant: MerchantStateAction =
  async function updateMerchant(_previousState, formData) {
    const { currentLedger } = await requireCurrentUserAndLedger();
    const validation = validateUpdateMerchantForm(formData);
    if (!validation.ok) return validationErrorState(validation.error);

    try {
      await (
        await getMerchantService()
      ).updateMerchant({
        ledgerId: currentLedger.id,
        ...validation.value,
      });
    } catch (error) {
      return actionErrorState(error, merchantErrorCodes.updateFailed, "update");
    }

    revalidateMerchantMutation();
    redirect(merchantEditHref(validation.value.merchantId));
  };

export const archiveMerchant: MerchantStateAction =
  async function archiveMerchant(_previousState, formData) {
    const { currentLedger } = await requireCurrentUserAndLedger();
    const validation = validateArchiveMerchantForm(formData);
    if (!validation.ok) return validationErrorState(validation.error);

    try {
      await (
        await getMerchantService()
      ).archiveMerchant({
        ledgerId: currentLedger.id,
        merchantId: validation.value.merchantId,
      });
    } catch (error) {
      return actionErrorState(
        error,
        merchantErrorCodes.archiveFailed,
        "archive",
      );
    }

    revalidateMerchantMutation();
    redirect(routePaths.merchants);
  };

export const createMerchantAlias: MerchantStateAction =
  async function createMerchantAlias(_previousState, formData) {
    const { currentLedger } = await requireCurrentUserAndLedger();
    const validation = validateCreateMerchantAliasForm(formData);
    if (!validation.ok) return validationErrorState(validation.error);

    try {
      await (
        await getMerchantService()
      ).createAlias({
        ledgerId: currentLedger.id,
        ...validation.value,
      });
    } catch (error) {
      return actionErrorState(
        error,
        merchantErrorCodes.aliasCreateFailed,
        "create alias",
      );
    }

    revalidateMerchantMutation();
    redirect(merchantEditHref(validation.value.merchantId));
  };

export const archiveMerchantAlias: MerchantStateAction =
  async function archiveMerchantAlias(_previousState, formData) {
    const { currentLedger } = await requireCurrentUserAndLedger();
    const validation = validateArchiveMerchantAliasForm(formData);
    if (!validation.ok) return validationErrorState(validation.error);

    let merchantId: string;
    try {
      merchantId = await (
        await getMerchantService()
      ).archiveAlias({
        aliasId: validation.value.aliasId,
        ledgerId: currentLedger.id,
      });
    } catch (error) {
      return actionErrorState(
        error,
        merchantErrorCodes.aliasArchiveFailed,
        "archive alias",
      );
    }

    revalidateMerchantMutation();
    redirect(merchantEditHref(merchantId));
  };

export const setPreferredMerchantAlias: MerchantStateAction =
  async function setPreferredMerchantAlias(_previousState, formData) {
    const { currentLedger } = await requireCurrentUserAndLedger();
    const validation = validateSetPreferredMerchantAliasForm(formData);
    if (!validation.ok) return validationErrorState(validation.error);

    try {
      await (
        await getMerchantService()
      ).setPreferredAlias({
        ledgerId: currentLedger.id,
        ...validation.value,
      });
    } catch (error) {
      return actionErrorState(
        error,
        merchantErrorCodes.aliasPreferredUpdateFailed,
        "set preferred alias",
      );
    }

    revalidateMerchantMutation();
    redirect(merchantEditHref(validation.value.merchantId));
  };

export const createMerchantTag: MerchantTagStateAction =
  async function createMerchantTag(_previousState, formData) {
    const { currentLedger } = await requireCurrentUserAndLedger();
    const validation = validateCreateMerchantTagForm(formData);
    if (!validation.ok) return validationErrorState(validation.error);
    try {
      await (
        await getMerchantService()
      ).createTag({
        ledgerId: currentLedger.id,
        ...validation.value,
      });
    } catch (error) {
      return actionErrorState(
        error,
        merchantErrorCodes.merchantTagCreateFailed,
        "create tag",
      );
    }
    revalidateMerchantMutation();
    return {};
  };

export const updateMerchantTag: MerchantTagStateAction =
  async function updateMerchantTag(_previousState, formData) {
    const { currentLedger } = await requireCurrentUserAndLedger();
    const validation = validateUpdateMerchantTagForm(formData);
    if (!validation.ok) return validationErrorState(validation.error);
    try {
      await (
        await getMerchantService()
      ).updateTag({
        ledgerId: currentLedger.id,
        ...validation.value,
      });
    } catch (error) {
      return actionErrorState(
        error,
        merchantErrorCodes.merchantTagUpdateFailed,
        "update tag",
      );
    }
    revalidateMerchantMutation();
    return {};
  };

export const archiveMerchantTag: MerchantTagStateAction =
  async function archiveMerchantTag(_previousState, formData) {
    const { currentLedger } = await requireCurrentUserAndLedger();
    const validation = validateArchiveMerchantTagForm(formData);
    if (!validation.ok) return validationErrorState(validation.error);
    try {
      await (
        await getMerchantService()
      ).archiveTag({
        ledgerId: currentLedger.id,
        tagId: validation.value.tagId,
      });
    } catch (error) {
      return actionErrorState(
        error,
        merchantErrorCodes.merchantTagArchiveFailed,
        "archive tag",
      );
    }
    revalidateMerchantMutation();
    return {};
  };

export const reorderMerchantTags: MerchantTagReorderAction =
  async function reorderMerchantTags(formData) {
    const { currentLedger } = await requireCurrentUserAndLedger();
    const validation = validateReorderMerchantTagsForm(formData);
    if (!validation.ok) return validationErrorState(validation.error);
    try {
      await (
        await getMerchantService()
      ).reorderTags({
        ledgerId: currentLedger.id,
        tagIds: validation.value.tagIds,
      });
    } catch (error) {
      return actionErrorState(
        error,
        merchantErrorCodes.merchantTagReorderFailed,
        "reorder tags",
      );
    }
    revalidateMerchantMutation();
    return {};
  };
