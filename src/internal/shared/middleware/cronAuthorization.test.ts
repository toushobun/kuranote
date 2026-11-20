import { describe, expect, it, vi } from "vitest";
import { authenticateCronRequest } from "./cronAuthorization";

describe("authenticateCronRequest", () => {
  it("没有配置密钥时返回 503", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = authenticateCronRequest(new Request("http://localhost"), "", "test");
    expect(result?.status).toBe(503);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("缺少 Bearer 或密钥不符时返回 401", () => {
    for (const authorization of [null, "test", "Bearer invalid"]) {
      const request = new Request("http://localhost", {
        headers: authorization ? { Authorization: authorization } : {},
      });
      expect(authenticateCronRequest(request, "secret", "test")?.status).toBe(401);
    }
  });

  it("匹配密钥时放行", () => {
    const request = new Request("http://localhost", {
      headers: { Authorization: "Bearer secret" },
    });
    expect(authenticateCronRequest(request, "secret", "test")).toBeNull();
  });
});
