// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { AuthenticationError } from "internal/shared/errors/appError";
import { createDailyExchangeRateService } from "./dailyExchangeRateService";

const query = { from: "CNY" as const, to: "JPY" as const, date: "2026-11-21" };

describe("dailyExchangeRateService", () => {
  it("未登录不会调用 Repository", async () => {
    const repository = { getDailyRate: vi.fn() };
    const service = createDailyExchangeRateService({
      currentUserId: null,
      repository,
    });
    await expect(service.getDailyRate(query)).rejects.toBeInstanceOf(
      AuthenticationError,
    );
    expect(repository.getDailyRate).not.toHaveBeenCalled();
  });

  it("正常返回实际取值日期", async () => {
    const repository = {
      getDailyRate: vi
        .fn()
        .mockResolvedValue({ rate: 21.05, rateDate: "2026-11-20" }),
    };
    const service = createDailyExchangeRateService({
      currentUserId: "user-1",
      repository,
    });
    await expect(service.getDailyRate(query)).resolves.toEqual({
      rate: 21.05,
      rateDate: "2026-11-20",
    });
  });
});
