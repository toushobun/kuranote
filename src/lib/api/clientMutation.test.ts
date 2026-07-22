import { afterEach, describe, expect, it, vi } from "vitest";

import { executeClientMutation } from "lib/api/clientMutation";

const options = {
  fallbackErrorMessage: "操作失败，请稍后重试。",
  init: {
    body: JSON.stringify({ value: "test" }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  },
  networkErrorMessage: "操作失败，请检查网络后重试。",
  url: "/api/example",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("executeClientMutation", () => {
  it("成功响应返回 ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await expect(executeClientMutation(options)).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(options.url, options.init);
  });

  it("失败响应优先返回统一错误响应中的安全消息", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          error: {
            code: "conflict",
            message: "内容已经发生变化。",
            status: 409,
          },
        }),
        ok: false,
      }),
    );

    await expect(executeClientMutation(options)).resolves.toEqual({
      errorMessage: "内容已经发生变化。",
      ok: false,
    });
  });

  it("失败响应不是统一结构时使用兜底消息", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: vi.fn().mockRejectedValue(new Error("invalid json")),
        ok: false,
      }),
    );

    await expect(executeClientMutation(options)).resolves.toEqual({
      errorMessage: options.fallbackErrorMessage,
      ok: false,
    });
  });

  it("网络异常时返回网络错误消息", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(executeClientMutation(options)).resolves.toEqual({
      errorMessage: options.networkErrorMessage,
      ok: false,
    });
  });
});
