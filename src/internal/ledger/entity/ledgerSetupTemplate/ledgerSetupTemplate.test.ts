import { describe, expect, it } from "vitest";

import { merchantTagEmojiValues } from "config/merchantTagEmojis";
import { ledgerSetupLimits } from "internal/ledger/entity/ledgerSetup";
import {
  getLedgerSetupTemplate,
  ledgerSetupAccountTypes,
  ledgerSetupCashAccount,
  registeredLedgerSetupTemplates,
} from "internal/ledger/entity/ledgerSetupTemplate/ledgerSetupTemplate";

const normalize = (value: string) => value.trim().toLowerCase();

/** 与 PostgreSQL length() 一致，按字符（code point）计数。 */
const charLength = (value: string) => [...value].length;

function findDuplicates(values: readonly string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value)) return true;
    seen.add(value);
    return false;
  });
}

describe("getLedgerSetupTemplate", () => {
  it("JPY 返回已注册的模板", () => {
    expect(getLedgerSetupTemplate("JPY")).toMatchObject({
      currency: "JPY",
      version: 1,
    });
  });

  it.each(["CNY", "USD", "XXX", ""])("未注册的币种 %s 返回 null", (code) => {
    expect(getLedgerSetupTemplate(code)).toBeNull();
  });

  it("现金账户固定为一项「现金」", () => {
    expect(ledgerSetupCashAccount).toEqual({ name: "现金", type: "cash" });
    expect(ledgerSetupAccountTypes).toEqual([
      "cash",
      "bank",
      "credit_card",
      "e_money",
    ]);
  });
});

describe("JPY 预设模板内容", () => {
  const template = getLedgerSetupTemplate("JPY");

  it("按定稿收录 14 个标签与去重后 94 家商家", () => {
    expect(template?.merchantTags).toHaveLength(14);
    expect(template?.merchants).toHaveLength(94);
  });

  it("默认勾选 7 个标签", () => {
    expect(
      template?.merchantTags
        .filter((tag) => tag.defaultSelected)
        .map((tag) => tag.name),
    ).toEqual([
      "超市",
      "便利店",
      "餐饮",
      "咖啡甜品",
      "药妆店",
      "生活杂货",
      "电商",
    ]);
  });

  it("多标签商家只定义一次并关联多个标签", () => {
    const tagKeysByName = new Map(
      template?.merchants.map((merchant) => [merchant.name, merchant.tagKeys]),
    );

    expect(tagKeysByName.get("Amazon")).toEqual(["ecommerce", "subscription"]);
    expect(tagKeysByName.get("Apple")).toEqual(["electronics", "subscription"]);
    expect(tagKeysByName.get("楽天")).toEqual(["ecommerce", "telecom"]);
  });

  it("账户候选按类型收录", () => {
    expect(template?.accountCandidates.bank).toHaveLength(11);
    expect(template?.accountCandidates.credit_card).toHaveLength(10);
    expect(template?.accountCandidates.e_money).toHaveLength(11);
  });
});

describe.each(registeredLedgerSetupTemplates.map((t) => [t.currency, t]))(
  "%s 模板约束",
  (_currency, template) => {
    it("模板版本为正整数", () => {
      expect(Number.isInteger(template.version)).toBe(true);
      expect(template.version).toBeGreaterThan(0);
    });

    it("所有商家显示名与别名（trim + 忽略大小写）全局唯一", () => {
      const names = template.merchants.flatMap((merchant) => [
        merchant.name,
        ...merchant.aliases.map(({ alias }) => alias),
      ]);

      expect(findDuplicates(names.map(normalize))).toEqual([]);
    });

    it("标签 key 与名称唯一，每个标签至少一个商家", () => {
      const tagKeys = template.merchantTags.map(({ key }) => key);

      expect(findDuplicates(tagKeys)).toEqual([]);
      expect(
        findDuplicates(
          template.merchantTags.map(({ name }) => normalize(name)),
        ),
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

    it("条数不超过完成写入的上限", () => {
      expect(template.merchantTags.length).toBeLessThanOrEqual(
        ledgerSetupLimits.maxMerchantTags,
      );
      expect(template.merchants.length).toBeLessThanOrEqual(
        ledgerSetupLimits.maxMerchants,
      );
    });

    it("账户候选在同一类型内不重复且长度合法", () => {
      for (const candidates of Object.values(template.accountCandidates)) {
        expect(findDuplicates(candidates.map(normalize))).toEqual([]);
        for (const name of candidates) {
          expect(charLength(name.trim())).toBeGreaterThan(0);
          expect(charLength(name.trim())).toBeLessThanOrEqual(
            ledgerSetupLimits.accountNameMaxLength,
          );
        }
      }
    });
  },
);
