import { describe, expect, it } from "vitest";

import { getLedgerSetupTemplate } from "internal/ledger/entity/ledgerSetupTemplate/ledgerSetupTemplate";
import type { LedgerSetupDraft } from "internal/ledger/schema/ledgerSetupDraft";
import {
  createDefaultLedgerSetupDraft,
  hasDuplicateLedgerSetupAccountName,
  isLedgerSetupAccountNameTaken,
  isLedgerSetupDraftMatchingTemplate,
  resolveLedgerSetupDraft,
} from "internal/ledger/util/ledgerSetupDraft";

const jpyTemplate = getLedgerSetupTemplate("JPY");

function withDraft(overrides: Partial<LedgerSetupDraft>): LedgerSetupDraft {
  return { ...createDefaultLedgerSetupDraft("JPY"), ...overrides };
}

describe("createDefaultLedgerSetupDraft", () => {
  it("JPY 默认只有现金账户，商家为默认勾选标签下的全部商家", () => {
    const draft = createDefaultLedgerSetupDraft("JPY");

    expect(draft).toMatchObject({
      accounts: { items: [{ name: "现金", type: "cash" }], skipped: false },
      features: { specialStatusEnabled: false },
      merchants: { skipped: false },
      templateCurrency: "JPY",
      templateVersion: jpyTemplate?.version,
    });
    expect(draft.merchants.selectedKeys).toHaveLength(50);
    expect(draft.merchants.selectedKeys).toEqual(
      expect.arrayContaining(["aeon", "seven_eleven", "amazon", "rakuten"]),
    );
    expect(draft.merchants.selectedKeys).not.toContain("uniqlo");
  });

  it("多标签商家只要任一所属标签默认勾选即选中", () => {
    const { selectedKeys } = createDefaultLedgerSetupDraft("JPY").merchants;

    // Amazon：电商（默认）+ 订阅服务；Apple：家电数码 + 订阅服务（都不默认）。
    expect(selectedKeys).toContain("amazon");
    expect(selectedKeys).not.toContain("apple");
    expect(new Set(selectedKeys).size).toBe(selectedKeys.length);
  });

  it("无模板币种没有预设商家，模板版本为 null", () => {
    expect(createDefaultLedgerSetupDraft("USD")).toEqual({
      accounts: { items: [{ name: "现金", type: "cash" }], skipped: false },
      features: { specialStatusEnabled: false },
      merchants: { selectedKeys: [], skipped: false },
      templateCurrency: "USD",
      templateVersion: null,
    });
  });
});

describe("resolveLedgerSetupDraft", () => {
  it("空草稿补全为当前币种的默认草稿", () => {
    expect(resolveLedgerSetupDraft({}, "JPY")).toEqual(
      createDefaultLedgerSetupDraft("JPY"),
    );
  });

  it("货币变更后只剩功能开关时，账户与商家按新币种恢复默认", () => {
    expect(
      resolveLedgerSetupDraft(
        { features: { specialStatusEnabled: true } },
        "USD",
      ),
    ).toEqual({
      ...createDefaultLedgerSetupDraft("USD"),
      features: { specialStatusEnabled: true },
    });
  });

  it("草稿与当前模板一致时保持不变", () => {
    const draft = withDraft({
      accounts: {
        items: [
          { name: "现金", type: "cash" },
          { name: "楽天銀行（生活费）", templateKey: "楽天銀行", type: "bank" },
        ],
        skipped: true,
      },
      merchants: { selectedKeys: ["amazon", "netflix"], skipped: true },
    });

    expect(resolveLedgerSetupDraft(draft, "JPY")).toEqual(draft);
  });

  it("模板版本变化时丢弃无法匹配的商家 key 与账户候选 key，保留其余选择", () => {
    const resolved = resolveLedgerSetupDraft(
      {
        ...withDraft({
          accounts: {
            items: [
              { name: "旧银行", templateKey: "旧银行", type: "bank" },
              {
                name: "楽天カード",
                templateKey: "楽天カード",
                type: "credit_card",
              },
            ],
            skipped: false,
          },
          merchants: {
            selectedKeys: ["amazon", "removed_merchant", "amazon"],
            skipped: false,
          },
        }),
        templateVersion: 999,
      },
      "JPY",
    );

    expect(resolved).toEqual(
      withDraft({
        accounts: {
          items: [
            { name: "旧银行", type: "bank" },
            {
              name: "楽天カード",
              templateKey: "楽天カード",
              type: "credit_card",
            },
          ],
          skipped: false,
        },
        merchants: { selectedKeys: ["amazon"], skipped: false },
      }),
    );
  });

  it("草稿币种与账本当前默认货币不一致时按当前币种模板校正", () => {
    const resolved = resolveLedgerSetupDraft(
      withDraft({
        accounts: {
          items: [{ name: "楽天銀行", templateKey: "楽天銀行", type: "bank" }],
          skipped: false,
        },
        merchants: { selectedKeys: ["amazon"], skipped: false },
      }),
      "USD",
    );

    expect(resolved).toEqual({
      accounts: {
        items: [{ name: "楽天銀行", type: "bank" }],
        skipped: false,
      },
      features: { specialStatusEnabled: false },
      merchants: { selectedKeys: [], skipped: false },
      templateCurrency: "USD",
      templateVersion: null,
    });
  });

  it("现金账户的候选 key 视为无法匹配", () => {
    const resolved = resolveLedgerSetupDraft(
      withDraft({
        accounts: {
          items: [{ name: "现金", templateKey: "现金", type: "cash" }],
          skipped: false,
        },
      }),
      "JPY",
    );

    expect(resolved.accounts.items).toEqual([{ name: "现金", type: "cash" }]);
  });
});

describe("isLedgerSetupDraftMatchingTemplate", () => {
  it("默认草稿与模板一致", () => {
    expect(
      isLedgerSetupDraftMatchingTemplate(createDefaultLedgerSetupDraft("JPY")),
    ).toBe(true);
    expect(
      isLedgerSetupDraftMatchingTemplate(createDefaultLedgerSetupDraft("USD")),
    ).toBe(true);
  });

  it.each<[string, Partial<LedgerSetupDraft>]>([
    ["模板版本不同", { templateVersion: 999 }],
    ["无模板币种带有版本", { templateCurrency: "USD", templateVersion: 1 }],
    [
      "无模板币种选择商家",
      {
        merchants: { selectedKeys: ["amazon"], skipped: false },
        templateCurrency: "USD",
        templateVersion: null,
      },
    ],
    [
      "商家 key 不存在",
      {
        merchants: { selectedKeys: ["unknown"], skipped: false },
      },
    ],
    [
      "账户候选 key 不属于该类型",
      {
        accounts: {
          items: [{ name: "PayPay", templateKey: "PayPay", type: "bank" }],
          skipped: false,
        },
      },
    ],
  ])("%s时不一致", (_label, overrides) => {
    expect(isLedgerSetupDraftMatchingTemplate(withDraft(overrides))).toBe(
      false,
    );
  });
});

describe("hasDuplicateLedgerSetupAccountName", () => {
  it("同一类型内名称忽略大小写与首尾空格重复", () => {
    expect(
      hasDuplicateLedgerSetupAccountName([
        { name: "PayPay", type: "e_money" },
        { name: " paypay ", type: "e_money" },
      ]),
    ).toBe(true);
  });

  it("不同类型可以同名", () => {
    expect(
      hasDuplicateLedgerSetupAccountName([
        { name: "PayPay", type: "e_money" },
        { name: "PayPay", type: "bank" },
      ]),
    ).toBe(false);
  });
});

describe("isLedgerSetupAccountNameTaken", () => {
  const accounts = [
    { name: "PayPay", type: "e_money" as const },
    { name: "現金", type: "cash" as const },
  ];

  it("同一类型下名称忽略大小写与首尾空格相同时视为已有", () => {
    expect(
      isLedgerSetupAccountNameTaken(accounts, {
        name: " paypay ",
        type: "e_money",
      }),
    ).toBe(true);
  });

  it("不同类型的同名账户不视为已有", () => {
    expect(
      isLedgerSetupAccountNameTaken(accounts, { name: "PayPay", type: "bank" }),
    ).toBe(false);
  });
});
