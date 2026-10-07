import { describe, expect, it } from "vitest";

import { ledgerSetupLimits } from "internal/ledger/entity/ledgerSetup";
import { ledgerSetupErrorCodes } from "internal/ledger/errors/ledgerSetup";
import {
  parseStoredLedgerSetupDraft,
  validateLedgerSetupDraftInput,
} from "internal/ledger/schema/ledgerSetupDraft";
import { createDefaultLedgerSetupDraft } from "internal/ledger/util/ledgerSetupDraft";

const draft = createDefaultLedgerSetupDraft("JPY");

describe("validateLedgerSetupDraftInput", () => {
  it("步骤在范围内且草稿符合 v1 结构时通过", () => {
    expect(validateLedgerSetupDraftInput({ draft, step: 3 })).toEqual({
      ok: true,
      value: { draft, step: 3 },
    });
  });

  it("账户名称去除首尾空格，未知字段被丢弃", () => {
    const result = validateLedgerSetupDraftInput({
      draft: {
        ...draft,
        accounts: {
          items: [{ extra: true, name: " 楽天銀行 ", type: "bank" }],
          skipped: false,
        },
        unknown: 1,
      },
      step: 2,
    });

    expect(result).toEqual({
      ok: true,
      value: {
        draft: {
          ...draft,
          accounts: {
            items: [{ name: "楽天銀行", type: "bank" }],
            skipped: false,
          },
        },
        step: 2,
      },
    });
  });

  it("无模板币种的模板版本可以为 null", () => {
    const usdDraft = createDefaultLedgerSetupDraft("USD");

    expect(usdDraft.templateVersion).toBeNull();
    expect(validateLedgerSetupDraftInput({ draft: usdDraft, step: 2 }).ok).toBe(
      true,
    );
  });

  it.each([0, 6, 2.5, "3", null])("步骤为 %s 时返回步骤错误", (step) => {
    expect(validateLedgerSetupDraftInput({ draft, step })).toEqual({
      error: ledgerSetupErrorCodes.stepInvalid,
      ok: false,
    });
  });

  it.each([
    ["数组", []],
    ["null", null],
    ["空对象", {}],
    ["缺少功能开关", { ...draft, features: undefined }],
    ["未知币种", { ...draft, templateCurrency: "XXX" }],
    ["模板版本为 0", { ...draft, templateVersion: 0 }],
    [
      "未知账户类型",
      {
        ...draft,
        accounts: { items: [{ name: "其他", type: "other" }], skipped: false },
      },
    ],
    [
      "账户名称为空",
      {
        ...draft,
        accounts: { items: [{ name: "  ", type: "cash" }], skipped: false },
      },
    ],
    [
      "账户名称超长",
      {
        ...draft,
        accounts: {
          items: [
            {
              name: "x".repeat(ledgerSetupLimits.accountNameMaxLength + 1),
              type: "bank",
            },
          ],
          skipped: false,
        },
      },
    ],
    [
      "账户数量超过上限",
      {
        ...draft,
        accounts: {
          items: Array.from(
            { length: ledgerSetupLimits.maxAccounts + 1 },
            (_, index) => ({ name: `银行${index}`, type: "bank" }),
          ),
          skipped: false,
        },
      },
    ],
    [
      "商家 key 为空",
      { ...draft, merchants: { selectedKeys: [""], skipped: false } },
    ],
  ])("草稿%s时返回结构错误", (_label, invalidDraft) => {
    expect(
      validateLedgerSetupDraftInput({ draft: invalidDraft, step: 2 }),
    ).toEqual({
      error: ledgerSetupErrorCodes.draftInvalid,
      ok: false,
    });
  });
});

describe("parseStoredLedgerSetupDraft", () => {
  it("刚创建的空草稿解析为各部分缺失", () => {
    expect(parseStoredLedgerSetupDraft({})).toEqual({});
  });

  it("保留符合结构的部分，丢弃不符合结构的部分", () => {
    expect(
      parseStoredLedgerSetupDraft({
        accounts: [{ type: "cash" }],
        features: { specialStatusEnabled: true },
        merchants: draft.merchants,
        templateCurrency: "JPY",
        templateVersion: "1",
      }),
    ).toEqual({
      features: { specialStatusEnabled: true },
      merchants: draft.merchants,
      templateCurrency: "JPY",
    });
  });

  it("无模板币种的模板版本 null 被保留", () => {
    expect(
      parseStoredLedgerSetupDraft({
        templateCurrency: "USD",
        templateVersion: null,
      }),
    ).toEqual({ templateCurrency: "USD", templateVersion: null });
  });

  it.each([[[]], [null], ["draft"]])("%j 不是 object 时返回 null", (value) => {
    expect(parseStoredLedgerSetupDraft(value)).toBeNull();
  });
});
