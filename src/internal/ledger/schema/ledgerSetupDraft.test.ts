import { describe, expect, it } from "vitest";

import { ledgerSetupDraftMaxBytes } from "internal/ledger/entity/ledgerSetup";
import { ledgerSetupErrorCodes } from "internal/ledger/errors/ledgerSetup";
import { validateLedgerSetupDraftInput } from "internal/ledger/schema/ledgerSetupDraft";

describe("validateLedgerSetupDraftInput", () => {
  it("步骤在范围内且草稿为 object 时通过", () => {
    expect(
      validateLedgerSetupDraftInput({ draft: { accounts: [] }, step: 3 }),
    ).toEqual({ ok: true, value: { draft: { accounts: [] }, step: 3 } });
  });

  it.each([0, 6, 2.5, "3", null])("步骤为 %s 时返回步骤错误", (step) => {
    expect(validateLedgerSetupDraftInput({ draft: {}, step })).toEqual({
      error: ledgerSetupErrorCodes.stepInvalid,
      ok: false,
    });
  });

  it.each([[[]], [null], ["draft"], [1]])(
    "草稿为 %j 时返回结构错误",
    (draft) => {
      expect(validateLedgerSetupDraftInput({ draft, step: 2 })).toEqual({
        error: ledgerSetupErrorCodes.draftInvalid,
        ok: false,
      });
    },
  );

  it("草稿超过大小上限时返回超限错误", () => {
    const draft = { note: "x".repeat(ledgerSetupDraftMaxBytes) };

    expect(validateLedgerSetupDraftInput({ draft, step: 2 })).toEqual({
      error: ledgerSetupErrorCodes.draftTooLarge,
      ok: false,
    });
  });

  it("按 UTF-8 字节数而不是字符数判断大小", () => {
    // 每个汉字占 3 字节，字符数未超限但字节数超限。
    const draft = { note: "账".repeat(ledgerSetupDraftMaxBytes / 2) };

    expect(validateLedgerSetupDraftInput({ draft, step: 2 })).toEqual({
      error: ledgerSetupErrorCodes.draftTooLarge,
      ok: false,
    });
  });
});
