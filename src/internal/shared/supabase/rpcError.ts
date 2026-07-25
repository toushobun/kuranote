export type RpcErrorLike = {
  code?: string | null;
  details?: string | null;
  hint?: string | null;
  message?: string | null;
};

export function findRpcBusinessError<TErrorCode extends string>(
  error: RpcErrorLike | null,
  errorMap: Readonly<Record<string, TErrorCode>>,
): TErrorCode | null {
  const businessErrorCode = error?.details?.trim();

  return businessErrorCode ? (errorMap[businessErrorCode] ?? null) : null;
}

export function mapRpcBusinessError<TErrorCode extends string>(
  error: RpcErrorLike | null,
  errorMap: Readonly<Record<string, TErrorCode>>,
  fallback: TErrorCode,
): TErrorCode {
  return findRpcBusinessError(error, errorMap) ?? fallback;
}
