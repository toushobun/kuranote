import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { parseEcbRates, runExchangeRateRefresh } from "./exchangeRateRefreshService";
import type { ExchangeRateRepository } from "../repository/exchangeRateRepository";

const rates = { CNY: 8, JPY: 180, USD: 1.1, GBP: 0.85, KRW: 1600, THB: 36 };
function mockRepository(latest: string | null): ExchangeRateRepository {
  return { latestDate: vi.fn().mockResolvedValue(latest), upsertRates: vi.fn().mockResolvedValue(undefined) };
}
function mockFetch(data: unknown) {
  return vi.fn().mockResolvedValue(new Response(JSON.stringify(data), { status: 200 }));
}
describe("exchangeRateRefreshService", () => {
  it("空表时从 2015-01-01 开始补齐", async () => {
    const repo = mockRepository(null);
    const fetcher = mockFetch({ base: "EUR", rates: { "2015-01-02": rates } });
    const result = await runExchangeRateRefresh(repo, fetcher, new Date("2026-11-20T00:00:00Z"));
    expect(fetcher.mock.calls[0][0]).toContain("/v1/2015-01-01..2026-11-20");
    expect(result.upserted).toBe(6);
    expect(repo.upsertRates).toHaveBeenCalledOnce();
  });
  it("有数据时从最后一日的下一日开始", async () => {
    const repo = mockRepository("2026-11-18");
    const fetcher = mockFetch({ base: "EUR", rates: { "2026-11-19": rates } });
    await runExchangeRateRefresh(repo, fetcher, new Date("2026-11-20T00:00:00Z"));
    expect(fetcher.mock.calls[0][0]).toContain("/v1/2026-11-19..2026-11-20");
  });
  it("最新日期不早于今天时不请求", async () => {
    const repo = mockRepository("2026-11-20");
    const fetcher = vi.fn();
    expect(await runExchangeRateRefresh(repo, fetcher, new Date("2026-11-20T12:00:00Z"))).toEqual({ from: null, to: "2026-11-20", upserted: 0 });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("格式不合法时整批拒绝写入", async () => {
    const repo = mockRepository(null);
    const fetcher = mockFetch({ base: "EUR", rates: { "2026-11-19": { ...rates, JPY: -1 } } });
    await expect(runExchangeRateRefresh(repo, fetcher, new Date("2026-11-20T00:00:00Z"))).rejects.toThrow();
    expect(repo.upsertRates).not.toHaveBeenCalled();
    expect(() => parseEcbRates({ base: "USD", rates: {} }, "2026-01-01", "2026-11-20")).toThrow();
    expect(() => parseEcbRates({ base: "EUR", rates: { "2026-11-19": { ...rates, XYZ: 3 } } }, "2026-01-01", "2026-11-20")).toThrow();
  });
  it("外部请求失败时抛出受控错误且不写入", async () => {
    const repo = mockRepository(null);
    const fetcher = vi.fn().mockRejectedValue(new Error("secret private connection"));
    await expect(runExchangeRateRefresh(repo, fetcher, new Date("2026-11-20T00:00:00Z"))).rejects.toThrow("获取参考汇率失败");
    expect(repo.upsertRates).not.toHaveBeenCalled();
  });
  it("周末无新增日汇率时不写入", async () => {
    const repo = mockRepository("2026-11-20");
    const fetcher = mockFetch({ base: "EUR", rates: {} });
    const result = await runExchangeRateRefresh(repo, fetcher, new Date("2026-11-22T02:00:00Z"));
    expect(result.upserted).toBe(0);
    expect(repo.upsertRates).not.toHaveBeenCalled();
  });
});
