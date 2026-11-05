import { describe, expect, it } from "vitest";
import { getLedgerSetupTemplate } from "internal/ledger";
import {
  buildMerchantChecklist,
  getAddedMerchantPresetKeys,
} from "./merchantPresets";

describe("merchantPresets", () => {
  const template = getLedgerSetupTemplate("jp")!;
  it("正式同名仍判重，跨商家的歧义别名不判重", () => {
    expect(getAddedMerchantPresetKeys(template, ["邮局"], ["邮局"])).toContain(
      "post_office",
    );
    expect(
      getAddedMerchantPresetKeys(template, ["中国邮政", "邮局"], ["中国邮政"]),
    ).not.toContain("post_office");
    expect(
      getAddedMerchantPresetKeys(template, ["邮局"], ["邮局"]),
    ).not.toContain("china_post");
  });
  it("按模板标签排序，保留图标并显示别名而不显示网址", () => {
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
});
