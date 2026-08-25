"use server";

import { createRequestContainer } from "internal/container";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import { revalidateTransactionColorSchemeMutation } from "internal/user/adapter/next/revalidate";
import { userErrorMessages } from "internal/user/errors";
import { parseTransactionColorSchemeForm } from "internal/user/schema";
import type { TransactionColorSchemeActionState } from "types/user";

function createErrorState(message: string): TransactionColorSchemeActionState {
  return { error: message, errorKey: crypto.randomUUID() };
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
