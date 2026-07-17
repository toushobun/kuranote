import { describe, expect, it } from "vitest";

import {
  validateArchiveCategoryForm,
  validateCreateCategoryForm,
  validateReorderCategoryForm,
  validateUpdateCategoryForm,
} from "./categories";

const categoryId = "00000000-0000-4000-8000-000000000101";
const secondCategoryId = "00000000-0000-4000-8000-000000000103";
const parentId = "00000000-0000-4000-8000-000000000102";

function createFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();

  formData.set("categoryId", categoryId);
  formData.set("iconName", "🍽️");
  formData.set("name", "食费");
  formData.set("type", "expense");
  formData.set("parentId", parentId);

  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }

  return formData;
}

describe("category validators", () => {
  it("新增分类表单校验通过", () => {
    expect(validateCreateCategoryForm(createFormData())).toEqual({
      ok: true,
      value: {
        iconName: "🍽️",
        name: "食费",
        parentId,
        type: "expense",
      },
    });
  });

  it("新增大分类允许 parentId 为空", () => {
    const result = validateCreateCategoryForm(createFormData({ parentId: "" }));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.parentId).toBeNull();
  });

  it("新增分类拒绝图标库以外的值", () => {
    expect(
      validateCreateCategoryForm(createFormData({ iconName: "not-an-emoji" })),
    ).toEqual({ error: "icon_invalid", ok: false });
  });

  it("新增分类拒绝非法类型", () => {
    expect(
      validateCreateCategoryForm(createFormData({ type: "transfer" })),
    ).toEqual({ error: "type_invalid", ok: false });
  });

  it("新增分类拒绝过长名称", () => {
    expect(
      validateCreateCategoryForm(createFormData({ name: "あ".repeat(101) })),
    ).toEqual({ error: "name_too_long", ok: false });
  });

  it("新增分类拒绝加上 Emoji 后超过数据库限制的名称", () => {
    expect(
      validateCreateCategoryForm(createFormData({ name: "あ".repeat(98) })),
    ).toEqual({ error: "name_too_long", ok: false });
  });

  it("更新分类表单校验通过", () => {
    expect(validateUpdateCategoryForm(createFormData())).toEqual({
      ok: true,
      value: { categoryId, iconName: "🍽️", name: "食费" },
    });
  });

  it("排序表单校验通过", () => {
    const result = validateReorderCategoryForm(
      createFormData({
        categoryIds: JSON.stringify([categoryId, secondCategoryId]),
        parentId: "",
      }),
    );

    expect(result).toEqual({
      ok: true,
      value: {
        categoryIds: [categoryId, secondCategoryId],
        parentId: null,
        type: "expense",
      },
    });
  });

  it("排序表单拒绝重复分类 ID", () => {
    expect(
      validateReorderCategoryForm(
        createFormData({
          categoryIds: JSON.stringify([categoryId, categoryId]),
        }),
      ),
    ).toEqual({ error: "order_invalid", ok: false });
  });

  it("归档分类拒绝非法分类 ID", () => {
    expect(
      validateArchiveCategoryForm(createFormData({ categoryId: "invalid" })),
    ).toEqual({ error: "category_invalid", ok: false });
  });
});
