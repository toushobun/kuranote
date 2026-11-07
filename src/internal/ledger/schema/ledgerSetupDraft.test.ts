import { describe, expect, it } from "vitest";

import {
  ledgerSetupDraftMaxBytes,
  ledgerSetupLimits,
} from "internal/ledger/entity/ledgerSetup";
import { getLedgerSetupTemplate } from "internal/ledger/entity/ledgerSetupTemplate/getLedgerSetupTemplate";
import {
  ledgerSetupAccountTypes,
  ledgerSetupRegions,
} from "internal/ledger/entity/ledgerSetupTemplate/ledgerSetupTemplate";
import { ledgerSetupErrorCodes } from "internal/ledger/errors/ledgerSetup";
import {
  parseStoredLedgerSetupDraft,
  type LedgerSetupDraft,
  validateLedgerSetupDraftInput,
} from "internal/ledger/schema/ledgerSetupDraft";
import { createDefaultLedgerSetupDraft } from "internal/ledger/util/ledgerSetupDraft";

const draft = createDefaultLedgerSetupDraft("jp");

describe("validateLedgerSetupDraftInput", () => {
  it.each(ledgerSetupRegions)(
    "生活地区为 %s 时，全选商家并选满账户仍有草稿空间",
    (region) => {
      const template = getLedgerSetupTemplate(region);
      if (!template) throw new Error("地区模板缺失");
      const additionalRegion = region === "jp" ? "cn" : "jp";
      const accounts = ledgerSetupRegions.flatMap((candidateRegion) =>
        ledgerSetupAccountTypes.flatMap((type) =>
          template.accountCandidatesByRegion[candidateRegion][type].map(
            (name) => ({ name, templateKey: name, type }),
          ),
        ),
      );
      // 选取序列化后占用空间最大的账户，覆盖最坏的合法组合。
      const items = accounts
        .sort(
          (left, right) =>
            Buffer.byteLength(JSON.stringify(right)) -
            Buffer.byteLength(JSON.stringify(left)),
        )
        .slice(0, ledgerSetupLimits.maxAccounts);
      const largestDraft: LedgerSetupDraft = {
        ...createDefaultLedgerSetupDraft(region, template),
        accounts: { items, skipped: false },
        merchants: {
          additionalRegions: [additionalRegion],
          selectedKeys: template.merchants.map(({ key }) => key),
          skipped: false,
        },
        features: {
          multiAccountPaymentEnabled: false,
          specialStatusEnabled: false,
        },
      };
      expect(
        validateLedgerSetupDraftInput({ draft: largestDraft, step: 5 }).ok,
      ).toBe(true);

      // jsonb::text 在字符串以外的逗号和冒号后各加一个空格。
      const jsonbText = JSON.stringify(largestDraft).replace(
        /"(?:[^"\\]|\\.)*"|[:,]/g,
        (token) => (token.length === 1 ? `${token} ` : token),
      );
      expect(Buffer.byteLength(jsonbText)).toBeLessThanOrEqual(
        ledgerSetupDraftMaxBytes,
      );
    },
  );

  it("商家上限300条，301条拒绝", () => {
    const makeDraft = (count: number) => ({
      ...draft,
      merchants: {
        selectedKeys: Array.from(
          { length: count },
          (_, index) => `merchant_${index}`,
        ),
        skipped: false,
      },
    });
    expect(
      validateLedgerSetupDraftInput({ draft: makeDraft(300), step: 3 }).ok,
    ).toBe(true);
    expect(
      validateLedgerSetupDraftInput({ draft: makeDraft(301), step: 3 }),
    ).toMatchObject({ ok: false, error: ledgerSetupErrorCodes.draftInvalid });
  });
  it("步骤在范围内且草稿符合 v2 结构时通过", () => {
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
          items: [
            {
              extra: true,
              name: " 楽天銀行 ",
              templateKey: "楽天銀行",
              type: "bank",
            },
          ],
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
            items: [
              { name: "楽天銀行", templateKey: "楽天銀行", type: "bank" },
            ],
            skipped: false,
          },
        },
        step: 2,
      },
    });
  });

  it("没有地区模板时模板版本可以为 null", () => {
    const noRegionDraft = createDefaultLedgerSetupDraft(null);

    expect(noRegionDraft.templateVersion).toBeNull();
    expect(
      validateLedgerSetupDraftInput({ draft: noRegionDraft, step: 2 }).ok,
    ).toBe(true);
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
    ["未知币种", { ...draft, templateRegion: "XXX" }],
    ["模板版本为 0", { ...draft, templateVersion: 0 }],
    [
      "未知账户类型",
      {
        ...draft,
        accounts: { items: [{ name: "其他", type: "other" }], skipped: false },
      },
    ],
    [
      "账户缺少 templateKey",
      {
        ...draft,
        accounts: {
          items: [{ name: "自己添加的账户", type: "bank" }],
          skipped: false,
        },
      },
    ],
    [
      "账户名称为空",
      {
        ...draft,
        accounts: {
          items: [{ name: "  ", templateKey: "日元现金", type: "cash" }],
          skipped: false,
        },
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
              templateKey: "楽天銀行",
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
            (_, index) => ({
              name: `银行${index}`,
              templateKey: `银行${index}`,
              type: "bank",
            }),
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
        templateRegion: "jp",
        templateVersion: "1",
      }),
    ).toEqual({
      merchants: draft.merchants,
      templateRegion: "jp",
    });
  });

  it("保留已保存的多账户付款开关", () => {
    expect(
      parseStoredLedgerSetupDraft({
        features: {
          multiAccountPaymentEnabled: true,
          specialStatusEnabled: false,
        },
      }),
    ).toEqual({
      features: {
        multiAccountPaymentEnabled: true,
        specialStatusEnabled: false,
      },
    });
  });

  it("没有地区模板时模板版本 null 被保留", () => {
    expect(
      parseStoredLedgerSetupDraft({
        templateRegion: null,
        templateVersion: null,
      }),
    ).toEqual({ templateRegion: null, templateVersion: null });
  });

  it.each([[[]], [null], ["draft"]])("%j 不是 object 时返回 null", (value) => {
    expect(parseStoredLedgerSetupDraft(value)).toBeNull();
  });
});
