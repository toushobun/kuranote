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
    expect(draft.accounts.items).toEqual([
      { name: "日元现金", templateKey: "日元现金", type: "cash" },
    ]);
    expect(draft.merchants.selectedKeys).toContain("apple");
    expect(draft.merchants.selectedKeys).not.toContain("hema");
    expect(draft.merchants.selectedKeys).not.toContain("jr");
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
    expect(draft.accounts.items).toEqual([
      { name: "人民币现金", templateKey: "人民币现金", type: "cash" },
    ]);
  });
  it("模板版本变化时保留仍在候选中的账户与商家及跳过状态，丢弃失效项并去重", () => {
    const stored = parseStoredLedgerSetupDraft({
      ...createDefaultLedgerSetupDraft("jp"),
      templateVersion: 1,
      accounts: {
        items: [
          { name: "旧候选", type: "bank", templateKey: "旧候选" },
          { name: "三井住友銀行", type: "bank", templateKey: "三井住友銀行" },
          { name: "三井住友銀行", type: "bank", templateKey: "三井住友銀行" },
        ],
        skipped: true,
      },
      merchants: {
        selectedKeys: ["apple", "aeon", "失效key", "aeon"],
        skipped: true,
      },
    })!;
    const draft = resolveLedgerSetupDraft(stored, "jp");
    expect(draft).toMatchObject({
      templateRegion: "jp",
      templateVersion: getLedgerSetupTemplate("jp")!.version,
      accounts: {
        items: [
          { name: "三井住友銀行", templateKey: "三井住友銀行", type: "bank" },
        ],
        skipped: true,
      },
      merchants: { selectedKeys: ["apple", "aeon"], skipped: true },
    });
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
    expect(getLedgerSetupTemplate("jp")?.version).toBe(5);
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
