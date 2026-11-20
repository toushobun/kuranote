import { RepositoryError } from "internal/shared/errors/appError";
import { ledgerCurrencies } from "internal/ledger";
import { exchangeRateErrorCodes, exchangeRateErrorMessages } from "../errors";
import {
  createExchangeRateRepository,
  type DailyExchangeRate,
  type ExchangeRateRepository,
} from "../repository/exchangeRateRepository";

const earliestDate = "2015-01-01";
const ecbApiUrl = "https://api.frankfurter.dev/v1/";
const currencies = ledgerCurrencies.filter((code) => code !== "EUR");
const currencySet = new Set<string>(currencies);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const fetchTimeoutMs = 20_000;

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !datePattern.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return (
    Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value
  );
}

function nextUtcDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** 接口响应完整校验后才允许写数据库，不能部分保存无效批次。 */
export function parseEcbRates(
  body: unknown,
  start: string,
  end: string,
): DailyExchangeRate[] {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new RepositoryError(
      exchangeRateErrorCodes.invalidResponse,
      exchangeRateErrorMessages[exchangeRateErrorCodes.invalidResponse],
    );
  }
  const result = body as Record<string, unknown>;
  if (
    result.base !== "EUR" ||
    !result.rates ||
    typeof result.rates !== "object" ||
    Array.isArray(result.rates)
  ) {
    throw new RepositoryError(
      exchangeRateErrorCodes.invalidResponse,
      exchangeRateErrorMessages[exchangeRateErrorCodes.invalidResponse],
    );
  }
  const rows: DailyExchangeRate[] = [];
  for (const [date, rates] of Object.entries(result.rates)) {
    if (
      !validDate(date) ||
      !rates ||
      typeof rates !== "object" ||
      Array.isArray(rates)
    ) {
      throw new RepositoryError(
        "exchange_rate_invalid_response",
        "汇率数据格式异常",
      );
    }
    const byCurrency = rates as Record<string, unknown>;
    if (
      Object.keys(byCurrency).length !== currencies.length ||
      currencies.some((code) => !Object.hasOwn(byCurrency, code))
    ) {
      throw new RepositoryError(
        "exchange_rate_invalid_response",
        "汇率数据缺少币种",
      );
    }
    for (const [currency, value] of Object.entries(byCurrency)) {
      if (
        !currencySet.has(currency) ||
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value <= 0
      ) {
        throw new RepositoryError(
          exchangeRateErrorCodes.invalidResponse,
          exchangeRateErrorMessages[exchangeRateErrorCodes.invalidResponse],
        );
      }
      if (date >= start && date <= end) {
        rows.push({
          rate_date: date,
          currency,
          rate_per_eur: value,
          source: "ecb",
        });
      }
    }
  }
  return rows;
}

export type ExchangeRateRefreshSummary = {
  from: string | null;
  to: string;
  upserted: number;
};

export async function runExchangeRateRefresh(
  repository: ExchangeRateRepository,
  fetchRates: typeof fetch = fetch,
  now: Date = new Date(),
): Promise<ExchangeRateRefreshSummary> {
  const today = now.toISOString().slice(0, 10);
  const latestDate = await repository.latestDate();
  const start = latestDate ? nextUtcDate(latestDate) : earliestDate;
  if (start > today) return { from: null, to: today, upserted: 0 };
  // 按自然年分段，避免超长历史区间被 API 降采样或响应体过大。
  // 每段成功写入后再请求下一段；中途失败时，下次从最新入库日续传。
  let cursor = start;
  let upserted = 0;
  while (cursor <= today) {
    const end = [`${cursor.slice(0, 4)}-12-31`, today].sort()[0];
    // URL 始终由静态可信域名和后端计算日期组成，不接受外部 URL 或重定向。
    const url = `${ecbApiUrl}${cursor}..${end}?base=EUR&symbols=${currencies.join(",")}`;
    let response: Response;
    try {
      response = await fetchRates(url, {
        signal: AbortSignal.timeout(fetchTimeoutMs),
        redirect: "error",
      });
    } catch {
      throw new RepositoryError(
        exchangeRateErrorCodes.providerFailed,
        exchangeRateErrorMessages[exchangeRateErrorCodes.providerFailed],
      );
    }
    if (!response.ok) {
      throw new RepositoryError(
        exchangeRateErrorCodes.providerFailed,
        exchangeRateErrorMessages[exchangeRateErrorCodes.providerFailed],
      );
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new RepositoryError(
        exchangeRateErrorCodes.invalidResponse,
        exchangeRateErrorMessages[exchangeRateErrorCodes.invalidResponse],
      );
    }
    const rates = parseEcbRates(body, cursor, end);
    if (rates.length) await repository.upsertRates(rates);
    upserted += rates.length;
    cursor = nextUtcDate(end);
  }
  return { from: start, to: today, upserted };
}

export function executeExchangeRateRefresh() {
  return runExchangeRateRefresh(createExchangeRateRepository());
}
