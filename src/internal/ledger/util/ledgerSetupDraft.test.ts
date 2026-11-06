import { describe, expect, it } from "vitest";
import { getLedgerSetupTemplate } from "internal/ledger/entity/ledgerSetupTemplate/getLedgerSetupTemplate";
import { parseStoredLedgerSetupDraft } from "internal/ledger/schema/ledgerSetupDraft";
import {
  createDefaultLedgerSetupDraft,
  resolveLedgerSetupDraft,
  isLedgerSetupDraftMatchingTemplate,
} from "./ledgerSetupDraft";
describe("地区草稿", () => {
  it("默认只选本地区前五类商家，多分类商家只算一次", () => {
    const draft = createDefaultLedgerSetupDraft("jp");
    expect(draft.accounts.items).toEqual([{ name: "现金", type: "cash" }]);
    expect(draft.merchants.selectedKeys).toContain("apple");
    expect(draft.merchants.selectedKeys).not.toContain("hema");
    expect(draft.merchants.selectedKeys).not.toContain("jr_east");
    expect(new Set(draft.merchants.selectedKeys).size).toBe(
      draft.merchants.selectedKeys.length,
    );
    expect(isLedgerSetupDraftMatchingTemplate(draft)).toBe(true);
  });
  it("中国默认选择中国商家和共用商家", () => {
    const draft = createDefaultLedgerSetupDraft("cn");
    expect(draft.merchants.selectedKeys).toContain("hema");
    expect(draft.merchants.selectedKeys).toContain("starbucks");
    expect(draft.merchants.selectedKeys).not.toContain("aeon");
  });
  it("旧草稿保留账户、商家勾选和跳过状态，不重选新增商家", () => {
    const stored = parseStoredLedgerSetupDraft({
      templateCurrency: "JPY",
      templateVersion: 1,
      accounts: {
        items: [{ name: "改名的账户", type: "bank", templateKey: "旧候选" }],
        skipped: true,
      },
      merchants: {
        selectedKeys: ["apple", "aeon", "失效key", "aeon"],
        skipped: true,
      },
      features: { specialStatusEnabled: true },
    })!;
    const draft = resolveLedgerSetupDraft(stored, "jp");
    expect(draft).toMatchObject({
      schemaVersion: 2,
      templateRegion: "jp",
      templateVersion: 3,
      accounts: {
        items: [{ name: "改名的账户", type: "bank" }],
        skipped: true,
      },
      merchants: { selectedKeys: ["apple", "aeon"], skipped: true },
      features: {
        specialStatusEnabled: true,
        multiAccountPaymentEnabled: false,
      },
    });
    expect(draft.accounts.items[0]).not.toHaveProperty("templateKey");
  });
  it("追加地区合法选择可保存，默认不自动增加任何勾选", () => {
    const draft = createDefaultLedgerSetupDraft("jp");
    const before = [...draft.merchants.selectedKeys];
    draft.merchants.additionalRegions = ["cn"];
    expect(draft.merchants.selectedKeys).toEqual(before);
    draft.merchants.selectedKeys.push("hema");
    expect(isLedgerSetupDraftMatchingTemplate(draft)).toBe(true);
    draft.merchants.additionalRegions = [];
    expect(isLedgerSetupDraftMatchingTemplate(draft)).toBe(false);
  });
  it.each([false, true])(
    "恢复与保存按相同追加地区范围过滤商家：%s",
    (additional) => {
      const draft = createDefaultLedgerSetupDraft("jp");
      draft.merchants.additionalRegions = additional ? ["cn"] : [];
      draft.merchants.selectedKeys = ["apple", "aeon", "hema"];
      const resolved = resolveLedgerSetupDraft(draft, "jp");
      expect(resolved.merchants.selectedKeys).toEqual(
        additional ? ["apple", "aeon", "hema"] : ["apple", "aeon"],
      );
      expect(isLedgerSetupDraftMatchingTemplate(resolved)).toBe(true);
    },
  );
  it("模板升级保留现有可匹配项，剔除失效key", () => {
    const draft = createDefaultLedgerSetupDraft("jp");
    draft.templateVersion = 1;
    draft.merchants.selectedKeys = ["starbucks", "不存在"];
    expect(isLedgerSetupDraftMatchingTemplate(draft)).toBe(false);
    expect(resolveLedgerSetupDraft(draft, "jp").merchants.selectedKeys).toEqual(
      ["starbucks"],
    );
    expect(getLedgerSetupTemplate("jp")?.version).toBe(3);
  });
  it("未知地区不猜测默认模板，缺失部分独立补全", () => {
    expect(resolveLedgerSetupDraft({}, null)).toEqual(
      createDefaultLedgerSetupDraft(null),
    );
    expect(createDefaultLedgerSetupDraft(null).merchants.selectedKeys).toEqual(
      [],
    );
  });
});
