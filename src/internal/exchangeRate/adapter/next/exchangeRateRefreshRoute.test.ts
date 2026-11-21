import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { handleExchangeRateRefreshRequest } from "./exchangeRateRefreshRoute";
describe("exchange-rate-refresh Cron", () => {
  it("未授权时不执行服务", async () => {
    const refresh = vi.fn();
    const response = await handleExchangeRateRefreshRequest(
      new Request("http://localhost/api/cron/exchange-rate-refresh"),
      { secret: "secret", refresh },
    );
    expect(response.status).toBe(401);
    expect(refresh).not.toHaveBeenCalled();
  });
  it("合法密钥返回同步摘要", async () => {
    const refresh = vi
      .fn()
      .mockResolvedValue({ from: null, to: "2026-11-20", upserted: 0 });
    const response = await handleExchangeRateRefreshRequest(
      new Request("http://localhost/api/cron/exchange-rate-refresh", {
        headers: { authorization: "Bearer secret" },
      }),
      { secret: "secret", refresh },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      from: null,
      to: "2026-11-20",
      upserted: 0,
    });
  });
  it("刷新失败返回安全的 500", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const refresh = vi
      .fn()
      .mockRejectedValue(new Error("hidden database connection string"));
    const response = await handleExchangeRateRefreshRequest(
      new Request("http://localhost/api/cron/exchange-rate-refresh", {
        headers: { authorization: "Bearer secret" },
      }),
      { secret: "secret", refresh },
    );
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("hidden");
    spy.mockRestore();
  });
});
