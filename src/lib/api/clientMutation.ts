export type ClientMutationResult =
  | { ok: true }
  | { errorMessage: string; ok: false };

type ClientMutationOptions = {
  fallbackErrorMessage: string;
  init: RequestInit;
  networkErrorMessage: string;
  onSuccess?: () => Promise<void> | void;
  url: string;
};

export async function executeClientMutation({
  fallbackErrorMessage,
  init,
  networkErrorMessage,
  onSuccess,
  url,
}: ClientMutationOptions): Promise<ClientMutationResult> {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch {
    return { errorMessage: networkErrorMessage, ok: false };
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);

    return {
      errorMessage: getErrorMessage(body) ?? fallbackErrorMessage,
      ok: false,
    };
  }

  await onSuccess?.();
  return { ok: true };
}

function getErrorMessage(value: unknown): string | null {
  if (!isRecord(value) || !isRecord(value.error)) return null;

  const message = value.error.message;
  return typeof message === "string" && message.trim() ? message : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
