"use server";

import { createRequestContainer } from "internal/container";
import {
  createErrorState,
  createSuccessState,
} from "internal/shared/adapter/next/actionState";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import {
  revalidateTransactionColorSchemeMutation,
  revalidateUserProfileMutation,
} from "internal/user/adapter/next/revalidate";
import { userErrorMessages } from "internal/user/errors";
import {
  parseThemeKeyForm,
  parseTransactionColorSchemeForm,
  parseUpdateAvatarForm,
  parseUpdateDisplayNameForm,
} from "internal/user/schema";
import type {
  AvatarActionState,
  DisplayNameActionState,
  ThemeKeyActionState,
  TransactionColorSchemeActionState,
} from "types/user";

/**
 * 主题由客户端乐观更新，界面状态已在 UserThemeProvider 中保持一致，
 * 这里不 revalidate，避免重新渲染 protected layout 时把旧值回灌到正在切换的主题。
 */
export async function updateThemeKey(
  _previousState: ThemeKeyActionState,
  formData: FormData,
): Promise<ThemeKeyActionState> {
  const parsed = parseThemeKeyForm(formData);

  if (!parsed.ok) {
    return createErrorState(parsed.error);
  }

  try {
    const dependencies = await createServerRequestDependencies();
    const profile = await createRequestContainer(
      dependencies,
    ).user.service.updateCurrentProfile(parsed.value);

    return { themeKey: profile.themeKey };
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorState(error.message);
    }

    console.error("[user] theme key action failed unexpectedly", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return createErrorState(userErrorMessages.themeKeyUpdateFailed);
  }
}

export async function updateTransactionColorScheme(
  _previousState: TransactionColorSchemeActionState,
  formData: FormData,
): Promise<TransactionColorSchemeActionState> {
  const parsed = parseTransactionColorSchemeForm(formData);

  if (!parsed.ok) {
    return createErrorState(parsed.error);
  }

  try {
    const dependencies = await createServerRequestDependencies();
    const profile = await createRequestContainer(
      dependencies,
    ).user.service.updateCurrentProfile(parsed.value);

    revalidateTransactionColorSchemeMutation();

    return {
      success: "收支配色方案已保存。",
      transactionColorScheme: profile.transactionColorScheme,
    };
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorState(error.message);
    }

    console.error(
      "[user] transaction color scheme action failed unexpectedly",
      {
        errorName: error instanceof Error ? error.name : "unknown",
      },
    );
    return createErrorState(
      userErrorMessages.transactionColorSchemeUpdateFailed,
    );
  }
}

export async function updateDisplayName(
  _previousState: DisplayNameActionState,
  formData: FormData,
): Promise<DisplayNameActionState> {
  const parsed = parseUpdateDisplayNameForm(formData);

  if (!parsed.ok) {
    return createErrorState(parsed.error);
  }

  try {
    const dependencies = await createServerRequestDependencies();
    await createRequestContainer(
      dependencies,
    ).user.service.updateCurrentDisplayName(parsed.value);

    revalidateUserProfileMutation();

    return createSuccessState("昵称已保存。");
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorState(error.message);
    }

    console.error("[user] display name action failed unexpectedly", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return createErrorState(userErrorMessages.displayNameUpdateFailed);
  }
}

export async function updateAvatar(
  _previousState: AvatarActionState,
  formData: FormData,
): Promise<AvatarActionState> {
  const parsed = parseUpdateAvatarForm(formData);

  if (!parsed.ok) {
    return createErrorState(parsed.error);
  }

  try {
    const dependencies = await createServerRequestDependencies();
    await createRequestContainer(dependencies).user.service.updateCurrentAvatar(
      parsed.value,
    );

    revalidateUserProfileMutation();

    return createSuccessState("头像已更换。");
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorState(error.message);
    }

    console.error("[user] avatar action failed unexpectedly", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return createErrorState(userErrorMessages.avatarUpdateFailed);
  }
}
