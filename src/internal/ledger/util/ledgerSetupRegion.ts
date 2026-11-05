import type { LedgerSetupRegion } from "internal/ledger/entity/ledgerSetupTemplate/ledgerSetupTemplate";

/** 时区仅用于首次预选，不覆盖用户或已保存草稿的选择。 */
export function getLedgerSetupRegionFromTimeZone(
  timeZone: string,
): LedgerSetupRegion | null {
  if (timeZone === "Asia/Tokyo" || timeZone === "Japan") return "jp";
  return [
    "Asia/Shanghai",
    "Asia/Chongqing",
    "Asia/Chungking",
    "Asia/Harbin",
    "Asia/Urumqi",
    "Asia/Kashgar",
    "PRC",
  ].includes(timeZone)
    ? "cn"
    : null;
}
