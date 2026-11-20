export const exchangeRateErrorCodes = {
  invalidResponse: "exchange_rate_invalid_response",
  providerFailed: "exchange_rate_provider_failed",
  readFailed: "exchange_rate_read_failed",
  writeFailed: "exchange_rate_write_failed",
} as const;

export type ExchangeRateErrorCode =
  (typeof exchangeRateErrorCodes)[keyof typeof exchangeRateErrorCodes];

export const exchangeRateErrorMessages: Record<
  ExchangeRateErrorCode,
  string
> = {
  [exchangeRateErrorCodes.invalidResponse]: "汇率数据格式异常",
  [exchangeRateErrorCodes.providerFailed]: "获取参考汇率失败",
  [exchangeRateErrorCodes.readFailed]: "汇率读取失败",
  [exchangeRateErrorCodes.writeFailed]: "汇率保存失败",
};
