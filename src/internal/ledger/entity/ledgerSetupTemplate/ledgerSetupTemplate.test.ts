import { describe, expect, it } from "vitest";
import { merchantTagEmojiValues } from "config/merchantTagEmojis";
import { ledgerSetupLimits } from "internal/ledger/entity/ledgerSetup";
import { getLedgerSetupTemplate } from "./getLedgerSetupTemplate";
import {
  ledgerSetupAccountTypes,
  ledgerSetupRegions,
} from "./ledgerSetupTemplate";
const normalize = (value: string) => value.trim().toLowerCase();
const charLength = (value: string) => [...value].length;
function findDuplicates(values: readonly string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value)) return true;
    seen.add(value);
    return false;
  });
}
describe("地区模板", () => {
  const template = getLedgerSetupTemplate("jp")!;
  it("日文原名与新增通用名别名保留正确的语言标记", () => {
    const aliases = (key: string) =>
      template.merchants.find((merchant) => merchant.key === key)!.aliases;
    expect(aliases("amazon")).toEqual(
      expect.arrayContaining([
        { alias: "Amazon", locale: "en" },
        { alias: "Amazonプライム", locale: "ja" },
      ]),
    );
    expect(aliases("docomo")).toContainEqual({
      alias: "NTTドコモ",
      locale: "ja",
    });
    expect(aliases("property_management")).toContainEqual({
      alias: "家賃",
      locale: "ja",
    });
    expect(aliases("prefectural_mutual_aid")).toContainEqual({
      alias: "県民共済",
      locale: "ja",
    });
  });
  it("按地区提供账户候选，币种不是模板入口", () => {
    expect(template.region).toBe("jp");
    expect(template.version).toBe(5);
    expect(getLedgerSetupTemplate("JPY")).toBeNull();
    expect(
      getLedgerSetupTemplate("cn")?.accountCandidatesByRegion.cn.e_money,
    ).toEqual(["支付宝", "微信支付", "云闪付", "数字人民币"]);
    expect(template.accountCandidatesByRegion.jp.cash).toEqual(["日元现金"]);
    expect(template.accountCandidatesByRegion.cn.cash).toEqual(["人民币现金"]);
    expect(ledgerSetupAccountTypes).toHaveLength(4);
  });
  it("商家唯一目录收录日本115家和中国独有79家", () => {
    expect(template.merchants).toHaveLength(194);
    expect(
      template.merchants.filter((m) => m.regions.includes("jp")),
    ).toHaveLength(115);
    expect(
      template.merchants.filter((m) => !m.regions.includes("jp")),
    ).toHaveLength(79);
    expect(new Set(template.merchants.map((m) => m.key)).size).toBe(194);
    expect(getLedgerSetupTemplate("cn")?.merchants).toBe(template.merchants);
  });
  it("7个分类中只有前4类默认勾选", () => {
    expect(template.merchantTags.map((t) => t.name)).toEqual([
      "超市",
      "便利店",
      "餐饮",
      "购物·订阅",
      "交通",
      "生活缴费",
      "公共服务",
    ]);
    expect(template.merchantTags.map((t) => t.defaultSelected)).toEqual([
      true,
      true,
      true,
      true,
      false,
      false,
      false,
    ]);
  });
  it("共用商家只定义一次，跨分类保留全部标签", () => {
    expect(template.merchants.find((m) => m.key === "apple")).toMatchObject({
      name: "苹果",
      regions: ["jp", "cn"],
      tagKeys: ["shopping"],
    });
    expect(template.merchants.find((m) => m.key === "rakuten")).toMatchObject({
      tagKeys: ["shopping", "living_expenses"],
    });
  });
  it("通用名之外均有官网，同一商家内部名称和别名去重", () => {
    for (const merchant of template.merchants) {
      expect(merchant.websiteUrl !== null || merchant.generic).toBe(true);
      expect(
        findDuplicates(
          [merchant.name, ...merchant.aliases.map((a) => a.alias)].map(
            normalize,
          ),
        ),
        merchant.key,
      ).toEqual([]);
    }
  });
});
describe.each(ledgerSetupRegions)("%s 模板约束", (region) => {
  const template = getLedgerSetupTemplate(region)!;
  it("标签 key 与名称唯一，每个标签至少一个商家", () => {
    const tagKeys = template.merchantTags.map(({ key }) => key);

    expect(findDuplicates(tagKeys)).toEqual([]);
    expect(
      findDuplicates(template.merchantTags.map(({ name }) => normalize(name))),
    ).toEqual([]);
    for (const key of tagKeys) {
      expect(
        template.merchants.some(({ tagKeys: keys }) => keys.includes(key)),
        key,
      ).toBe(true);
    }
  });

  it("标签排序唯一", () => {
    expect(
      findDuplicates(
        template.merchantTags.map(({ sortOrder }) => String(sortOrder)),
      ),
    ).toEqual([]);
  });

  it("商家 key 唯一，商家的标签 key 都存在且不重复", () => {
    const tagKeys = new Set(template.merchantTags.map(({ key }) => key));

    expect(findDuplicates(template.merchants.map(({ key }) => key))).toEqual(
      [],
    );
    for (const merchant of template.merchants) {
      expect(merchant.tagKeys.length, merchant.key).toBeGreaterThan(0);
      expect(findDuplicates(merchant.tagKeys), merchant.key).toEqual([]);
      for (const tagKey of merchant.tagKeys) {
        expect(tagKeys.has(tagKey), `${merchant.key}:${tagKey}`).toBe(true);
      }
    }
  });

  it("key 符合草稿约束", () => {
    const keys = [
      ...template.merchantTags.map(({ key }) => key),
      ...template.merchants.map(({ key }) => key),
    ];

    for (const key of keys) {
      expect(key).toMatch(/^[a-z0-9_]+$/);
      expect(key.length).toBeLessThanOrEqual(
        ledgerSetupLimits.templateKeyMaxLength,
      );
    }
  });

  it("名称与别名长度、locale 符合各表约束", () => {
    for (const tag of template.merchantTags) {
      expect(charLength(tag.name.trim())).toBeGreaterThan(0);
      expect(charLength(tag.name.trim())).toBeLessThanOrEqual(
        ledgerSetupLimits.merchantTagNameMaxLength,
      );
    }

    for (const merchant of template.merchants) {
      expect(charLength(merchant.name.trim())).toBeGreaterThan(0);
      expect(charLength(merchant.name.trim())).toBeLessThanOrEqual(
        ledgerSetupLimits.merchantNameMaxLength,
      );
      expect(merchant.aliases.length).toBeLessThanOrEqual(
        ledgerSetupLimits.maxMerchantAliases,
      );
      expect(merchant.tagKeys.length).toBeLessThanOrEqual(
        ledgerSetupLimits.maxMerchantTagKeys,
      );

      for (const { alias, locale } of merchant.aliases) {
        expect(alias).toBe(alias.trim());
        expect(charLength(alias)).toBeGreaterThan(0);
        expect(charLength(alias)).toBeLessThanOrEqual(
          ledgerSetupLimits.aliasMaxLength,
        );
        expect(charLength(locale.trim())).toBeGreaterThanOrEqual(
          ledgerSetupLimits.aliasLocaleMinLength,
        );
        expect(charLength(locale.trim())).toBeLessThanOrEqual(
          ledgerSetupLimits.aliasLocaleMaxLength,
        );
      }
    }
  });

  it("标签 icon 符合 merchant_tags 约束且可在标签编辑中选择", () => {
    for (const { icon } of template.merchantTags) {
      expect(charLength(icon)).toBeGreaterThan(0);
      expect(charLength(icon)).toBeLessThanOrEqual(
        ledgerSetupLimits.merchantTagIconMaxLength,
      );
      expect(merchantTagEmojiValues.has(icon), icon).toBe(true);
    }
  });

  it("官网 URL 均为 https://", () => {
    for (const { websiteUrl } of template.merchants) {
      if (websiteUrl !== null) {
        expect(new URL(websiteUrl).protocol).toBe("https:");
      }
    }
  });

  it("官网 origin 可由数据库侧 merchant_favicon_url 按相同结果提取", () => {
    // 数据库侧只从 URL 开头提取小写 ASCII 主机名生成头像地址，
    // 模板官网需满足该形式，否则完成写入时 iconUrl 校验会不一致。
    for (const { websiteUrl } of template.merchants) {
      if (websiteUrl !== null) {
        expect(websiteUrl).toMatch(/^https:\/\/[a-z0-9.-]+(?:[/?#]|$)/);
        expect(websiteUrl.startsWith(`${new URL(websiteUrl).origin}`)).toBe(
          true,
        );
      }
    }
  });

  it("条数不超过完成写入的上限", () => {
    expect(template.merchantTags.length).toBeLessThanOrEqual(
      ledgerSetupLimits.maxMerchantTags,
    );
    expect(template.merchants.length).toBeLessThanOrEqual(
      ledgerSetupLimits.maxMerchants,
    );
  });

  it("账户候选在同一类型内不重复且长度合法", () => {
    for (const candidates of Object.values(
      template.accountCandidatesByRegion,
    ).flatMap((byType) => Object.values(byType))) {
      expect(findDuplicates(candidates.map(normalize))).toEqual([]);
      for (const name of candidates) {
        expect(charLength(name.trim())).toBeGreaterThan(0);
        expect(charLength(name.trim())).toBeLessThanOrEqual(
          ledgerSetupLimits.accountNameMaxLength,
        );
      }
    }
  });
});
