import { describe, expect, it } from "vitest";

import {
  parseDeleteLedgerPlaceholderMemberForm,
  parseRenameLedgerPlaceholderMemberForm,
} from "internal/ledger/schema/ledgerPlaceholderMemberForm";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const placeholderId = "00000000-0000-4000-8000-000000000051";

function form(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  return formData;
}

describe("parseRenameLedgerPlaceholderMemberForm", () => {
  it("解析账本、占位与新名字", () => {
    expect(
      parseRenameLedgerPlaceholderMemberForm(
        form({ displayName: "外婆", ledgerId, placeholderId }),
      ),
    ).toEqual({
      ok: true,
      value: { displayName: "外婆", ledgerId, placeholderId },
    });
  });

  it("去除首尾空白后返回名字", () => {
    expect(
      parseRenameLedgerPlaceholderMemberForm(
        form({ displayName: "  奶奶 ", ledgerId, placeholderId }),
      ),
    ).toEqual({
      ok: true,
      value: { displayName: "奶奶", ledgerId, placeholderId },
    });
  });

  it.each([
    [{ displayName: "奶奶", ledgerId: "x", placeholderId }, "ledger_not_found"],
    [
      { displayName: "  ", ledgerId, placeholderId },
      "placeholder_name_invalid",
    ],
    [
      { displayName: "a".repeat(101), ledgerId, placeholderId },
      "placeholder_name_too_long",
    ],
  ])("非法输入 %j 返回 %s", (values, error) => {
    expect(parseRenameLedgerPlaceholderMemberForm(form(values))).toEqual({
      error,
      ok: false,
    });
  });

  it("占位 ID 非法时返回 placeholder_not_found", () => {
    expect(
      parseRenameLedgerPlaceholderMemberForm(
        form({ displayName: "外婆", ledgerId, placeholderId: "bad" }),
      ),
    ).toEqual({ error: "placeholder_not_found", ok: false });
  });
});

describe("parseDeleteLedgerPlaceholderMemberForm", () => {
  it("解析账本与占位", () => {
    expect(
      parseDeleteLedgerPlaceholderMemberForm(form({ ledgerId, placeholderId })),
    ).toEqual({ ok: true, value: { ledgerId, placeholderId } });
  });

  it("缺少占位 ID 时失败", () => {
    expect(parseDeleteLedgerPlaceholderMemberForm(form({ ledgerId }))).toEqual({
      error: "placeholder_not_found",
      ok: false,
    });
  });
});
