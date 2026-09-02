// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  createMerchantRequestSchema,
  validateArchiveMerchantAliasForm,
  validateArchiveMerchantForm,
  validateArchiveMerchantTagForm,
  validateCreateMerchantAliasForm,
  validateCreateMerchantForm,
  validateCreateMerchantTagForm,
  validateReorderMerchantTagsForm,
  validateSetPreferredMerchantAliasForm,
  validateUpdateMerchantForm,
  validateUpdateMerchantTagForm,
} from "internal/merchant/schema";

const merchantId = "00000000-0000-4000-8000-000000001001";
const aliasId = "00000000-0000-4000-8000-000000001002";
const tagId = "00000000-0000-4000-8000-000000002001";

function createFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("merchantId", merchantId);
  formData.set("aliasId", aliasId);
  formData.set("name", "LIFE");
  formData.set("websiteUrl", "https://example.com");
  formData.set("note", "常用超市");
  formData.set("alias", "来福");
  formData.set("icon", "🛒");
  formData.set("tagId", tagId);
  for (const [key, value] of Object.entries(overrides))
    formData.set(key, value);
  return formData;
}

describe("merchant schema", () => {
  it("展示名可选择正式名或有效别名", () => {
    expect(validateSetPreferredMerchantAliasForm(createFormData())).toEqual({
      ok: true,
      value: { aliasId, merchantId },
    });
    expect(
      validateSetPreferredMerchantAliasForm(createFormData({ aliasId: "" })),
    ).toEqual({ ok: true, value: { aliasId: null, merchantId } });
    expect(
      validateSetPreferredMerchantAliasForm(
        createFormData({ aliasId: "not-a-uuid" }),
      ),
    ).toMatchObject({ ok: false, error: "alias_invalid" });
  });
  it("新增商家表单允许 HTTP/HTTPS 网址及空可选字段", () => {
    expect(validateCreateMerchantForm(createFormData())).toEqual({
      ok: true,
      value: {
        name: "LIFE",
        note: "常用超市",
        siteUrl: "https://example.com",
        tagIds: [],
      },
    });
    expect(
      validateCreateMerchantForm(createFormData({ note: "", websiteUrl: "" })),
    ).toEqual({
      ok: true,
      value: { name: "LIFE", note: null, siteUrl: null, tagIds: [] },
    });
  });

  it("HTTP 请求体不要求账本 ID，非法网址和超长名称会被拒绝", () => {
    expect(
      createMerchantRequestSchema.safeParse({
        name: "LIFE",
        note: null,
        siteUrl: "https://example.com",
      }).success,
    ).toBe(true);
    expect(
      validateCreateMerchantForm(
        createFormData({ websiteUrl: "ftp://example.com" }),
      ),
    ).toEqual({ error: "website_url_invalid", ok: false });
    expect(
      createMerchantRequestSchema.safeParse({
        name: "x".repeat(101),
        note: null,
        siteUrl: null,
      }).success,
    ).toBe(false);
  });

  it("HTTP 请求体拒绝重复的商家标签 ID", () => {
    expect(
      createMerchantRequestSchema.safeParse({
        name: "LIFE",
        note: null,
        siteUrl: null,
        tagIds: [tagId, tagId],
      }).success,
    ).toBe(false);
  });

  it("更新和新增别名失败时返回对应校验错误", () => {
    expect(validateUpdateMerchantForm(createFormData({ name: "" }))).toEqual({
      error: "name_required",
      ok: false,
    });
    expect(
      validateCreateMerchantAliasForm(createFormData({ alias: "" })),
    ).toEqual({ error: "alias_required", ok: false });
  });

  it("归档商家与别名只接受 UUID", () => {
    expect(validateArchiveMerchantForm(createFormData())).toEqual({
      ok: true,
      value: { merchantId },
    });
    expect(validateArchiveMerchantAliasForm(createFormData())).toEqual({
      ok: true,
      value: { aliasId },
    });
  });

  it("商家表单读取去重且有效的标签 ID", () => {
    const formData = createFormData();
    formData.append("tagIds", tagId);
    expect(validateCreateMerchantForm(formData)).toMatchObject({
      ok: true,
      value: { tagIds: [tagId] },
    });
    formData.append("tagIds", tagId);
    expect(validateCreateMerchantForm(formData)).toEqual({
      error: "merchant_tag_invalid",
      ok: false,
    });
  });

  it("校验标签新增、更新、归档与完整排序表单", () => {
    const formData = createFormData({ name: "超市" });
    expect(validateCreateMerchantTagForm(formData)).toEqual({
      ok: true,
      value: { icon: "🛒", name: "超市" },
    });
    expect(validateUpdateMerchantTagForm(formData)).toMatchObject({
      ok: true,
      value: { tagId },
    });
    expect(validateArchiveMerchantTagForm(formData)).toEqual({
      ok: true,
      value: { tagId },
    });
    formData.set("tagIds", JSON.stringify([tagId]));
    expect(validateReorderMerchantTagsForm(formData)).toEqual({
      ok: true,
      value: { tagIds: [tagId] },
    });
  });

  it("拒绝预设集合之外的商家标签图标", () => {
    expect(
      validateCreateMerchantTagForm(createFormData({ icon: "invalid" })),
    ).toEqual({
      error: "merchant_tag_icon_invalid",
      ok: false,
    });
  });
});
