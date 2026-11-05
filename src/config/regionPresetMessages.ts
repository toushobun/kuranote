import type { LedgerSetupRegion } from "internal/ledger";

const regionNames = { jp: "日本", cn: "中国" } as const;

export const regionPresetMessages = {
  label: "你主要在哪里生活？",
  names: regionNames,
  recommendation: (region: LedgerSetupRegion) =>
    `按${regionNames[region]}常用商家推荐`,
  change: "更改",
  collapse: "收起",
  merchantGroup: (region: LedgerSetupRegion) =>
    `${region === "jp" ? "🇯🇵" : "🇨🇳"} ${regionNames[region]}常用商家`,
  addMerchants: (region: LedgerSetupRegion) =>
    `添加${regionNames[region]}常用商家`,
  addCandidates: (region: LedgerSetupRegion) =>
    `添加${regionNames[region]}账户候选`,
  alsoIn: (groups: readonly string[]) => `也在：${groups.join("、")}`,
} as const;
