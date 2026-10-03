// @vitest-environment node

import { describe, expect, it } from "vitest";

import { userErrorMessages } from "internal/user/errors";
import {
  parseTransactionColorSchemeForm,
  parseUpdateAvatarForm,
  parseUpdateDisplayNameForm,
  updateUserProfileRequestSchema,
} from "internal/user/schema";

describe("user schema", () => {
  it("接受收支配色方案作为单一资料更新字段", () => {
    expect(
      updateUserProfileRequestSchema.safeParse({
        transactionColorScheme: "expense_green_income_red",
      }).success,
    ).toBe(true);
  });

  it("拒绝非法收支配色方案", () => {
    const formData = new FormData();
    formData.set("transactionColorScheme", "invalid");

    expect(parseTransactionColorSchemeForm(formData)).toEqual({
      error: userErrorMessages.transactionColorSchemeInvalid,
      ok: false,
    });
  });

  it("解析有效收支配色方案表单", () => {
    const formData = new FormData();
    formData.set("transactionColorScheme", "expense_red_income_green");

    expect(parseTransactionColorSchemeForm(formData)).toEqual({
      ok: true,
      value: { transactionColorScheme: "expense_red_income_green" },
    });
  });
});

const ledgerId = "00000000-0000-4000-8000-000000000101";

function createDisplayNameFormData(
  displayName: string | null,
  syncLedgerIds: string[] = [],
) {
  const formData = new FormData();
  if (displayName !== null) formData.set("displayName", displayName);
  syncLedgerIds.forEach((id) => formData.append("syncLedgerIds", id));
  return formData;
}

describe("parseUpdateDisplayNameForm", () => {
  it("去除首尾空白并解析勾选账本", () => {
    expect(
      parseUpdateDisplayNameForm(
        createDisplayNameFormData(" 新昵称 ", [ledgerId]),
      ),
    ).toEqual({
      ok: true,
      value: { displayName: "新昵称", syncLedgerIds: [ledgerId] },
    });
  });

  it("没有勾选账本时解析为空数组", () => {
    expect(
      parseUpdateDisplayNameForm(createDisplayNameFormData("新昵称")),
    ).toEqual({
      ok: true,
      value: { displayName: "新昵称", syncLedgerIds: [] },
    });
  });

  it.each([
    ["缺少昵称", null, userErrorMessages.displayNameRequired],
    ["昵称为空白", "   ", userErrorMessages.displayNameRequired],
    ["昵称超过 100 字", "名".repeat(101), userErrorMessages.displayNameTooLong],
  ])("%s时返回源头校验文案", (_label, displayName, error) => {
    expect(
      parseUpdateDisplayNameForm(createDisplayNameFormData(displayName)),
    ).toEqual({ error, ok: false });
  });

  it("100 字昵称可以通过校验", () => {
    expect(
      parseUpdateDisplayNameForm(createDisplayNameFormData("名".repeat(100))),
    ).toMatchObject({ ok: true });
  });

  it("账本 ID 不是 UUID 时拒绝", () => {
    expect(
      parseUpdateDisplayNameForm(
        createDisplayNameFormData("新昵称", ["not-a-uuid"]),
      ),
    ).toEqual({ error: userErrorMessages.displayNameLedgerInvalid, ok: false });
  });
});

describe("parseUpdateAvatarForm", () => {
  function createAvatarForm(file?: FormDataEntryValue) {
    const formData = new FormData();
    if (file !== undefined) formData.set("avatar", file);
    return formData;
  }

  it.each(["image/jpeg", "image/png", "image/webp"])(
    "接受 %s 格式的头像",
    (type) => {
      const file = new File(["x"], "avatar", { type });

      expect(parseUpdateAvatarForm(createAvatarForm(file))).toEqual({
        ok: true,
        value: { contentType: type, file: expect.any(Blob) },
      });
    },
  );

  it.each([
    ["没有文件", undefined],
    ["字段不是文件", "avatar.webp"],
    ["文件为空", new File([], "avatar.webp", { type: "image/webp" })],
  ])("%s时要求选择图片", (_label, value) => {
    expect(parseUpdateAvatarForm(createAvatarForm(value))).toEqual({
      error: userErrorMessages.avatarFileRequired,
      ok: false,
    });
  });

  it("拒绝不支持的文件类型", () => {
    const file = new File(["x"], "avatar.gif", { type: "image/gif" });

    expect(parseUpdateAvatarForm(createAvatarForm(file))).toEqual({
      error: userErrorMessages.avatarFileTypeUnsupported,
      ok: false,
    });
  });

  it("1MB 以内可以通过，超过 1MB 时拒绝", () => {
    const limit = new File([new Uint8Array(1024 * 1024)], "a.webp", {
      type: "image/webp",
    });
    const tooLarge = new File([new Uint8Array(1024 * 1024 + 1)], "b.webp", {
      type: "image/webp",
    });

    expect(parseUpdateAvatarForm(createAvatarForm(limit)).ok).toBe(true);
    expect(parseUpdateAvatarForm(createAvatarForm(tooLarge))).toEqual({
      error: userErrorMessages.avatarFileTooLarge,
      ok: false,
    });
  });
});
