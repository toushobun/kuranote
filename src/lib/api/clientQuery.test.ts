import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchClientJson } from "./clientQuery";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchClientJson", () => {
  it("成功时返回 JSON 并带上取消信号", async () => {
    const fetchMock = vi.fn(async () => Response.json([{ id: 1 }]));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await expect(
      fetchClientJson("/api/items", controller.signal),
    ).resolves.toEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/items",
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it.each([
    ["非 2xx", async () => Response.json({ error: {} }, { status: 500 })],
    [
      "网络错误",
      async () => {
        throw new TypeError("Failed to fetch");
      },
    ],
    ["无法解析", async () => new Response("<html>")],
  ])("%s时返回 null", async (_name, implementation) => {
    vi.stubGlobal("fetch", vi.fn(implementation));

    await expect(fetchClientJson("/api/items")).resolves.toBeNull();
  });
});
