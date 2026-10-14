import { describe, expect, it } from "vitest";
import { getLedgerSetupTemplate } from "internal/ledger";
import {
  buildMerchantChecklist,
  getAddedMerchantPresetKeys,
  getMerchantMatchNames,
} from "./merchantPresets";

describe("merchantPresets", () => {
  const template = getLedgerSetupTemplate("JPY")!;
  it("按模板标签排序，保留 emoji，并仅显示名称与官网域名", () => {
    const checklist = buildMerchantChecklist(template);
    expect(checklist.groups.map(({ key }) => key)).toEqual(
      [...template.merchantTags]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(({ key }) => key),
    );
    expect(checklist.groups[0]!.icon).toBe(template.merchantTags[0]!.icon);
    const merchant = template.merchants.find(({ websiteUrl }) => !!websiteUrl)!;
    expect(
      checklist.items.find(({ key }) => key === merchant.key),
    ).toMatchObject({
      name: merchant.name,
      secondaryText: expect.not.stringContaining("https://"),
    });
  });
  it("预设名称、任一别名匹配已有名称集合，忽略大小写和前后空白", () => {
    const merchant = template.merchants.find(({ aliases }) => aliases.length)!;
    expect(
      getAddedMerchantPresetKeys(template, [
        ` ${merchant.aliases[0]!.alias.toUpperCase()} `,
      ]),
    ).toContain(merchant.key);
    expect(
      getAddedMerchantPresetKeys(template, [merchant.name.toLowerCase()]),
    ).toContain(merchant.key);
  });
  it("导入上下文共用正式名、展示名、别名去重入口", () => {
    expect(
      getMerchantMatchNames({
        name: "Brand",
        display_name: "Alias",
        aliases: [{ alias: "Alias" }, { alias: "Other" }],
      }),
    ).toEqual(["Brand", "Alias", "Other"]);
  });
});
