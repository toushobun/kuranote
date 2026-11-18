// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  createMerchantRequestSchema,
  validateArchiveMerchantForm,
  validateArchiveMerchantTagForm,
  validateCreateMerchantForm,
  validateCreateMerchantTagForm,
  validateFetchMerchantIconForm,
  validateReorderMerchantTagsForm,
  validateReorderMerchantsForm,
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
  formData.set("addedAliases", "[]");
  formData.set("archivedAliasIds", "[]");
  formData.set("preferredAlias", "");
  formData.set("icon", "🛒");
  formData.set("tagId", tagId);
  for (const [key, value] of Object.entries(overrides))
    formData.set(key, value);
  return formData;
}

describe("merchant schema", () => {
  it("图标获取表单只校验网址，不接受商家写入参数", () => {
    expect(validateFetchMerchantIconForm(createFormData())).toEqual({
      ok: true,
      value: { websiteUrl: "https://example.com" },
    });
    expect(
      validateFetchMerchantIconForm(createFormData({ merchantId: "" })),
    ).toEqual({
      ok: true,
      value: { websiteUrl: "https://example.com" },
    });
    expect(
      validateFetchMerchantIconForm(createFormData({ websiteUrl: "" })),
    ).toEqual({ error: "website_url_invalid", ok: false });
  });

  it("新增商家表单允许 HTTP/HTTPS 网址及空可选字段", () => {
    expect(validateCreateMerchantForm(createFormData())).toEqual({
      ok: true,
      value: {
        name: "LIFE",
        note: "常用超市",
        previewIconUrl: null,
        siteUrl: "https://example.com",
        tagIds: [],
      },
    });
    expect(
      validateCreateMerchantForm(createFormData({ note: "", websiteUrl: "" })),
    ).toEqual({
      ok: true,
      value: {
        name: "LIFE",
        note: null,
        previewIconUrl: null,
        siteUrl: null,
        tagIds: [],
      },
    });
  });

  it("商家表单携带有效预览图标，非法隐藏值按未预览处理", () => {
    const previewIconUrl =
      "https://t2.gstatic.com/faviconV2?url=https://example.com&size=128";
    expect(
      validateCreateMerchantForm(createFormData({ previewIconUrl })),
    ).toMatchObject({ ok: true, value: { previewIconUrl } });
    expect(
      validateCreateMerchantForm(
        createFormData({ previewIconUrl: "not-a-url" }),
      ),
    ).toMatchObject({ ok: true, value: { previewIconUrl: null } });
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

  it("商家备注最多允许 200000 个字", () => {
    expect(
      validateCreateMerchantForm(createFormData({ note: "x".repeat(200000) })),
    ).toMatchObject({ ok: true, value: { note: "x".repeat(200000) } });
    expect(
      validateUpdateMerchantForm(createFormData({ note: "x".repeat(200001) })),
    ).toEqual({ error: "note_too_long", ok: false });
    expect(
      createMerchantRequestSchema.safeParse({
        name: "LIFE",
        note: "x".repeat(200001),
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

  it("更新商家校验新增、归档别名及显示名", () => {
    expect(validateUpdateMerchantForm(createFormData({ name: "" }))).toEqual({
      error: "name_required",
      ok: false,
    });
    expect(
      validateUpdateMerchantForm(
        createFormData({
          addedAliases: '["来福","LIFE日语"]',
          archivedAliasIds: '["00000000-0000-4000-8000-000000001002"]',
          preferredAlias: "来福",
        }),
      ),
    ).toMatchObject({
      ok: true,
      value: {
        addedAliases: ["来福", "LIFE日语"],
        archivedAliasIds: [aliasId],
        preferredAlias: "来福",
      },
    });
    expect(
      validateUpdateMerchantForm(
        createFormData({
          addedAliases: '["来福","来福"]',
        }),
      ),
    ).toEqual({ error: "alias_invalid", ok: false });
    expect(
      validateUpdateMerchantForm(
        createFormData({
          addedAliases: '["LIFE"]',
        }),
      ),
    ).toEqual({ error: "alias_invalid", ok: false });
    expect(
      validateUpdateMerchantForm(
        createFormData({
          archivedAliasIds: '["not-uuid"]',
        }),
      ),
    ).toEqual({ error: "alias_invalid", ok: false });
    expect(
      validateUpdateMerchantForm(
        createFormData({
          addedAliases: "not-json",
        }),
      ),
    ).toEqual({ error: "alias_invalid", ok: false });
  });

  it("归档商家只接受 UUID", () => {
    expect(validateArchiveMerchantForm(createFormData())).toEqual({
      ok: true,
      value: { merchantId },
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

describe("validateReorderMerchantsForm", () => {
  it.each([200, 201])("排序数组最多允许 200 个商家：%s", (count) => {
    const merchantIds = Array.from(
      { length: count },
      (_, index) =>
        `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    );
    const result = validateReorderMerchantsForm(
      createFormData({ merchantIds: JSON.stringify(merchantIds) }),
    );
    expect(result.ok).toBe(count === 200);
    if (!result.ok) expect(result.error).toBe("merchant_order_invalid");
  });
});
