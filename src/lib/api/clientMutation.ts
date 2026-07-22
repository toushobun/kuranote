export type ClientMutationResult =
  | { ok: true }
  | { errorMessage: string; ok: false };

type ClientMutationOptions = {
  fallbackErrorMessage: string;
  init: RequestInit;
  networkErrorMessage: string;
  url: string;
};

export async function executeClientMutation({
  fallbackErrorMessage,
  init,
  networkErrorMessage,
  url,
}: ClientMutationOptions): Promise<ClientMutationResult> {
  try {
    const response = await fetch(url, init);

    if (response.ok) {
      return { ok: true };
    }

    const body: unknown = await response.json().catch(() => null);

    return {
      errorMessage: getErrorMessage(body) ?? fallbackErrorMessage,
      ok: false,
    };
  } catch {
    return { errorMessage: networkErrorMessage, ok: false };
  }
}

function getErrorMessage(value: unknown): string | null {
  if (!isRecord(value) || !isRecord(value.error)) return null;

  const message = value.error.message;
  return typeof message === "string" && message.trim() ? message : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
