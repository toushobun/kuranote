export function findRpcErrorCode<TErrorCode extends string>(
  details: string | null | undefined,
  errorCodes: readonly TErrorCode[],
): TErrorCode | null {
  const businessErrorCode = details?.trim();
  return (
    errorCodes.find((errorCode) => errorCode === businessErrorCode) ?? null
  );
}
