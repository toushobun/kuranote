import { describe, expect, it } from "vitest";

import {
  parseTimeZoneOffsetMinutes,
  toTransactionTimestamp,
} from "./transactionTimestamp";

describe("transactionTimestamp", () => {
  it.each(["-840", "-540", "0", "330", "840"])(
    "接受范围内的整分钟时区偏移 %s",
    (value) => {
      expect(parseTimeZoneOffsetMinutes(value)).toBe(Number(value));
    },
  );

  it.each(["", "-841", "841", "1.5", "abc", " 0", "+60"])(
    "拒绝非法时区偏移 %s",
    (value) => {
      expect(parseTimeZoneOffsetMinutes(value)).toBeNull();
    },
  );

  it.each(["form", "import"] as const)(
    "%s 格式按浏览器偏移转换 UTC 并处理跨年",
    (format) => {
      const separator = format === "form" ? "T" : " ";
      expect(
        toTransactionTimestamp(`2026-01-01${separator}00:30:15`, -540, format),
      ).toBe("2025-12-31T15:30:15.000Z");
      expect(
        toTransactionTimestamp(`2026-12-31${separator}23:30:15`, 60, format),
      ).toBe("2027-01-01T00:30:15.000Z");
      expect(
        toTransactionTimestamp(`2024-02-29${separator}12:00:00`, 0, format),
      ).toBe("2024-02-29T12:00:00.000Z");
    },
  );

  it("仅表单允许省略秒数且两种格式不能混用", () => {
    expect(toTransactionTimestamp("2026-09-17T10:00", -540, "form")).toBe(
      "2026-09-17T01:00:00.000Z",
    );
    expect(toTransactionTimestamp("2026-09-17 10:00", 0, "import")).toBeNull();
    expect(
      toTransactionTimestamp("2026-09-17T10:00:00", 0, "import"),
    ).toBeNull();
    expect(toTransactionTimestamp("2026-09-17 10:00:00", 0, "form")).toBeNull();
  });

  it.each([
    "2026-02-29T10:00:00",
    "2026-04-31T10:00:00",
    "2026-13-01T10:00:00",
    "2026-01-00T10:00:00",
    "2026-01-01T24:00:00",
    "2026-01-01T10:60:00",
    "2026-01-01T10:00:60",
    "2026-01-01T10:00:00Z",
    "invalid",
  ])("拒绝不存在的日期时间或格式 %s", (value) => {
    expect(toTransactionTimestamp(value, 0, "form")).toBeNull();
    expect(
      toTransactionTimestamp(value.replace("T", " "), 0, "import"),
    ).toBeNull();
  });

  it.each([-841, 841, 1.5, NaN, Infinity])(
    "转换时也拒绝非法偏移 %s",
    (offset) => {
      expect(
        toTransactionTimestamp("2026-01-01T10:00", offset, "form"),
      ).toBeNull();
      expect(
        toTransactionTimestamp("2026-01-01 10:00:00", offset, "import"),
      ).toBeNull();
    },
  );
});
