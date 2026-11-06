import type { LedgerSetupRegion } from "internal/ledger";

const regionNames = { jp: "日本", cn: "中国" } as const;
const regionFlags = {
  jp: { emoji: "🇯🇵", src: "/flags/jp.svg" },
  cn: { emoji: "🇨🇳", src: "/flags/cn.svg" },
} as const;

export const regionPresetMessages = {
  label: "你主要在哪里生活？",
  names: regionNames,
  merchantGroup: (region: LedgerSetupRegion) => ({
    flag: regionFlags[region],
    title: `${regionNames[region]}常用商家`,
  }),
  merchantSelectedCount: (selected: number) => `已选 ${selected} 家`,
  sharedMerchants: (region: LedgerSetupRegion) =>
    `两地共有的商家已列在${regionNames[region]}常用商家中`,
  addCandidates: (region: LedgerSetupRegion) =>
    `添加${regionNames[region]}账户候选`,
  alsoIn: (groups: readonly string[]) => `也在：${groups.join("、")}`,
} as const;
