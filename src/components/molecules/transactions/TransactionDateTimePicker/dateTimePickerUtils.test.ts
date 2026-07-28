import { describe, expect, it, vi } from "vitest";

import {
  buildCalendarDays,
  formatAccessibleDate,
  formatDateOnlyLabel,
  formatDateTimeLabel,
  formatDateValue,
  formatFullDateLabel,
  formatTimeDisplay,
  getMonthStart,
  pad,
  splitTimeValue,
} from "./dateTimePickerUtils";

describe("dateTimePickerUtils", () => {
  it("构建包含前置空格和闰日的完整日历网格", () => {
    const days = buildCalendarDays(new Date(2024, 1, 1));

    expect(days).toHaveLength(35);
    expect(days.slice(0, 4)).toEqual([null, null, null, null]);
    expect(days[4]?.value).toBe("2024-02-01");
    expect(days[32]?.value).toBe("2024-02-29");
    expect(days.at(-1)).toBeNull();
  });

  it("格式化日期值和无障碍日期", () => {
    const date = new Date(2026, 6, 8);

    expect(formatDateValue(date)).toBe("2026-07-08");
    expect(formatAccessibleDate(date)).toBe("2026年7月8日");
    expect(formatFullDateLabel("2026-07-08")).toBe(
      "2026年7月8日 星期三",
    );
  });

  it("区分今天、普通日期和无效日期标签", () => {
    expect(formatDateOnlyLabel("2026-07-28", "2026-07-28")).toBe(
      "今天 07月28日",
    );
    expect(formatDateOnlyLabel("2026-07-27", "2026-07-28")).toBe(
      "2026年07月27日",
    );
    expect(formatDateOnlyLabel("invalid", "2026-07-28")).toBe("请选择日期");
    expect(formatDateTimeLabel("invalid", "09:30", "2026-07-28")).toBe(
      "请选择日期",
    );
  });

  it("补齐秒数并把越界时间限制在合法范围", () => {
    expect(splitTimeValue("09:08")).toEqual({ hour: 9, minute: 8, second: 0 });
    expect(splitTimeValue("99:88:77")).toEqual({
      hour: 23,
      minute: 59,
      second: 59,
    });
    expect(splitTimeValue("invalid")).toEqual({
      hour: 0,
      minute: 0,
      second: 0,
    });
    expect(formatTimeDisplay("9:8")).toBe("00:00:00");
    expect(formatTimeDisplay("09:08")).toBe("09:08:00");
  });

  it("取得所选日期的月初并为数字补零", () => {
    expect(getMonthStart("2026-07-28")).toEqual(new Date(2026, 6, 1));
    expect(pad(7)).toBe("07");
    expect(pad(12)).toBe("12");
  });

  it("日期值无效时使用当前月份", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 28, 10, 0, 0));

    expect(getMonthStart("invalid")).toEqual(new Date(2026, 6, 1));

    vi.useRealTimers();
  });
});
