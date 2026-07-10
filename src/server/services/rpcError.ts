export type RpcErrorLike = {
  code?: string | null;
  details?: string | null;
  hint?: string | null;
  message?: string | null;
};

export function mapRpcBusinessError<TErrorCode extends string>(
  error: RpcErrorLike | null,
  errorMap: Readonly<Record<string, TErrorCode>>,
  fallback: TErrorCode,
): TErrorCode {
  const businessErrorCode = error?.details?.trim();

  if (!businessErrorCode) {
    return fallback;
  }

  return errorMap[businessErrorCode] ?? fallback;
}
