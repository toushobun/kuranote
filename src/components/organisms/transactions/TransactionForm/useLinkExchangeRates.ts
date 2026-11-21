"use client";
import { useEffect, useState } from "react";
import { fetchClientJson } from "lib/api/clientQuery";
import type { LinkExchangeRate } from "./crossCurrencyLinkPreview";

type DailyRateResponse = {
  rate: number | null;
  rateDate: string | null;
};

/** 仅查询需要换算的币种对；日期或付款账户变化时中止旧请求。 */
export function useLinkExchangeRates(
  incomeCurrency: string | undefined,
  tokyoDate: string,
  targetCurrencies: readonly string[],
) {
  const targets = [...new Set(targetCurrencies.filter(
    (currency) => currency && currency !== incomeCurrency,
  ))].sort();
  const key = incomeCurrency && tokyoDate && targets.length > 0
    ? [incomeCurrency, tokyoDate, ...targets].join("|")
    : "";
  const [state, setState] = useState<{
    key: string;
    rates: Record<string, LinkExchangeRate | null>;
  } | null>(null);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const [from, date, ...toCurrencies] = key.split("|");
    void Promise.all(toCurrencies.map(async (to) => {
      const query = new URLSearchParams({ from, to, date });
      try {
        const data = await fetchClientJson<DailyRateResponse>(
          "/api/exchange-rates/daily?" + query.toString(),
          controller.signal,
        );
        return [to, data?.rate && data.rate > 0 && data.rateDate
          ? { rate: data.rate, rateDate: data.rateDate }
          : null] as const;
      } catch {
        return [to, null] as const;
      }
    })).then((pairs) => {
      if (!controller.signal.aborted)
        setState({ key, rates: Object.fromEntries(pairs) });
    });
    return () => controller.abort();
  }, [key]);

  const isLoading = !!key && state?.key !== key;
  const getRate = (targetCurrency: string): LinkExchangeRate | null => {
    if (!incomeCurrency || !targetCurrency) return null;
    if (targetCurrency === incomeCurrency)
      return { rate: 1, rateDate: tokyoDate };
    return state?.key === key ? state.rates[targetCurrency] ?? null : null;
  };
  return { isLoading, getRate };
}
