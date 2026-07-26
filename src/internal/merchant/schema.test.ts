// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  createMerchantRequestSchema,
  validateArchiveMerchantAliasForm,
  validateArchiveMerchantForm,
  validateCreateMerchantAliasForm,
  validateCreateMerchantForm,
  validateUpdateMerchantForm,
} from "internal/merchant/schema";

const merchantId = "00000000-0000-4000-8000-000000001001";
const aliasId = "00000000-0000-4000-8000-000000001002";

function createFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("merchantId", merchantId);
  formData.set("aliasId", aliasId);
  formData.set("name", "LIFE");
  formData.set("websiteUrl", "https://example.com");
  formData.set("note", "常用超市");
  formData.set("alias", "来福");
  for (const [key, value] of Object.entries(overrides))
    formData.set(key, value);
  return formData;
}

describe("merchant schema", () => {
  it("新增商家表单允许 HTTP/HTTPS 网址及空可选字段", () => {
    expect(validateCreateMerchantForm(createFormData())).toEqual({
      ok: true,
      value: {
        name: "LIFE",
        note: "常用超市",
        siteUrl: "https://example.com",
      },
    });
    expect(
      validateCreateMerchantForm(createFormData({ note: "", websiteUrl: "" })),
    ).toEqual({
      ok: true,
      value: { name: "LIFE", note: null, siteUrl: null },
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
});
