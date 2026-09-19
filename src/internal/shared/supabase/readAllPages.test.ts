// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { readAllPages } from "./readAllPages";

describe("readAllPages", () => {
  it("按实际条数读取到空页，即使服务端上限小于请求页长也不遗漏", async () => {
    const read = vi
      .fn()
      .mockResolvedValueOnce([1, 2])
      .mockResolvedValueOnce([3])
      .mockResolvedValueOnce([]);
    await expect(readAllPages(read)).resolves.toEqual([1, 2, 3]);
    expect(read.mock.calls).toEqual([
      [0, 500],
      [2, 500],
      [3, 500],
    ]);
  });
  it("中途查询失败时抛出错误而不是返回不完整结果", async () => {
    const read = vi
      .fn()
      .mockResolvedValueOnce([1])
      .mockRejectedValueOnce(new Error("失败"));
    await expect(readAllPages(read)).rejects.toThrow("失败");
  });
});
