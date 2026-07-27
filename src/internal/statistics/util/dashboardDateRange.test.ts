import { afterEach, describe, expect, it } from "vitest";

import { getDashboardDateRange } from "internal/statistics/util/dashboardDateRange";

const originalTimezone = process.env.TZ;

afterEach(() => {
  process.env.TZ = originalTimezone;
});

describe("getDashboardDateRange", () => {
  it("将日本时间月初和次月月初转换为 UTC", () => {
    const range = getDashboardDateRange(new Date("2026-06-15T12:00:00.000Z"));

    expect(range.month).toBe("2026-06");
    expect(range.monthStartIso).toBe("2026-05-31T15:00:00.000Z");
    expect(range.monthEndIso).toBe("2026-06-30T15:00:00.000Z");
  });

  it("UTC 尚在上月时仍使用日本时间所在月份", () => {
    const range = getDashboardDateRange(new Date("2026-05-31T16:00:00.000Z"));

    expect(range.month).toBe("2026-06");
    expect(range.monthStartIso).toBe("2026-05-31T15:00:00.000Z");
    expect(range.monthEndIso).toBe("2026-06-30T15:00:00.000Z");
  });

  it("运行时系统时区变化时结果保持一致", () => {
    const now = new Date("2026-06-07T16:00:00.000Z");

    process.env.TZ = "UTC";
    const utcRange = getDashboardDateRange(now);

    process.env.TZ = "America/Los_Angeles";
    const losAngelesRange = getDashboardDateRange(now);

    expect(losAngelesRange).toEqual(utcRange);
  });
});
