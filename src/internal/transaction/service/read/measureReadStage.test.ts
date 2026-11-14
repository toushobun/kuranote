import { describe, expect, it, vi } from "vitest";
import { measureReadStage } from "internal/transaction/service/read/measureReadStage";

describe("measureReadStage", () => {
  it("成功时返回原结果并上报耗时", async () => {
    const onTiming = vi.fn();
    const result = await measureReadStage(
      "pageRpc",
      async () => ({ total: 2 }),
      onTiming,
    );

    expect(result).toEqual({ total: 2 });
    expect(onTiming).toHaveBeenCalledOnce();
    expect(onTiming).toHaveBeenCalledWith("pageRpc", expect.any(Number));
    expect(onTiming.mock.calls[0]?.[1]).toBeGreaterThanOrEqual(0);
  });

  it("失败时仍上报耗时并原样抛出错误", async () => {
    const onTiming = vi.fn();
    const error = new Error("读取失败");

    await expect(
      measureReadStage(
        "items",
        async () => {
          throw error;
        },
        onTiming,
      ),
    ).rejects.toBe(error);

    expect(onTiming).toHaveBeenCalledOnce();
    expect(onTiming).toHaveBeenCalledWith("items", expect.any(Number));
  });

  it("没有回调时仍正常读取且不需要计时", async () => {
    const read = vi.fn().mockResolvedValue("成功");
    await expect(measureReadStage("payments", read)).resolves.toBe("成功");
    expect(read).toHaveBeenCalledOnce();
  });
});
