import { describe, expect, it } from "vitest";
import { getLedgerSetupRegionFromTimeZone } from "./ledgerSetupRegion";

describe("getLedgerSetupRegionFromTimeZone", () => {
  it.each(["Asia/Tokyo", "Japan"])("日本时区 %s 预选日本", (timeZone) => {
    expect(getLedgerSetupRegionFromTimeZone(timeZone)).toBe("jp");
  });
  it.each([
    "Asia/Shanghai",
    "Asia/Chongqing",
    "Asia/Harbin",
    "Asia/Urumqi",
    "PRC",
  ])("中国时区 %s 预选中国", (timeZone) => {
    expect(getLedgerSetupRegionFromTimeZone(timeZone)).toBe("cn");
  });
  it.each(["UTC", "Asia/Singapore", "Europe/London", "", "未知"])(
    "其他时区 %s 不猜测地区",
    (timeZone) => {
      expect(getLedgerSetupRegionFromTimeZone(timeZone)).toBeNull();
    },
  );
});
