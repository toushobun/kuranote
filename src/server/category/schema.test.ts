// @vitest-environment node

import { describe, expect, it } from "vitest";

import { categoryErrorCodes } from "server/category/categoryErrors";
import {
  createCategoryRequestSchema,
  parseCreateCategoryForm,
  parseReorderCategoriesForm,
  parseUpdateCategoryForm,
  reorderCategoriesRequestSchema,
} from "server/category/schema";

const categoryId = "00000000-0000-4000-8000-000000000101";
const secondCategoryId = "00000000-0000-4000-8000-000000000102";

function createCategoryFormData() {
  const formData = new FormData();
  formData.set("iconName", "🍽️");
  formData.set("name", "餐饮");
  formData.set("parentId", "");
  formData.set("type", "expense");
  return formData;
}

describe("category schema", () => {
  it("创建请求会 trim 名称并接受图标库中的 Emoji", () => {
    expect(
      createCategoryRequestSchema.parse({
        iconName: "🍽️",
        name: "  餐饮  ",
        parentId: null,
        type: "expense",
      }),
    ).toEqual({
      iconName: "🍽️",
      name: "餐饮",
      parentId: null,
      type: "expense",
    });
  });

  it("存储名称加上 Emoji 后超过 100 个 Unicode 字符时拒绝", () => {
    const result = createCategoryRequestSchema.safeParse({
      iconName: "🍽️",
      name: "食".repeat(99),
      parentId: null,
      type: "expense",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        categoryErrorCodes.nameTooLong,
      );
    }
  });

  it("Server Action 创建表单复用同一 Schema 错误码", () => {
    const formData = createCategoryFormData();
    formData.set("iconName", "not-an-emoji");

    expect(parseCreateCategoryForm(formData)).toEqual({
      error: categoryErrorCodes.iconInvalid,
      ok: false,
    });
  });

  it("更新表单保留合法 categoryId 供错误回跳定位", () => {
    const formData = createCategoryFormData();
    formData.set("categoryId", categoryId);
    formData.set("name", "");

    expect(parseUpdateCategoryForm(formData)).toEqual({
      categoryId,
      error: categoryErrorCodes.nameRequired,
      ok: false,
    });
  });

  it("更新表单不把非法 categoryId 带回错误 URL", () => {
    const formData = createCategoryFormData();
    formData.set("categoryId", "invalid-category-id");

    expect(parseUpdateCategoryForm(formData)).toEqual({
      error: categoryErrorCodes.categoryInvalid,
      ok: false,
    });
  });

  it("排序拒绝重复、空数组和超过上限的分类 ID", () => {
    expect(
      reorderCategoriesRequestSchema.safeParse({
        categoryIds: [categoryId, categoryId],
        parentId: null,
        type: "expense",
      }).success,
    ).toBe(false);
    expect(
      reorderCategoriesRequestSchema.safeParse({
        categoryIds: [],
        parentId: null,
        type: "expense",
      }).success,
    ).toBe(false);
    expect(
      reorderCategoriesRequestSchema.safeParse({
        categoryIds: Array.from(
          { length: 201 },
          (_, index) =>
            `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
        ),
        parentId: null,
        type: "expense",
      }).success,
    ).toBe(false);
  });

  it("排序表单 JSON 损坏或分类 ID 非法时返回 order_invalid", () => {
    const malformedJsonForm = new FormData();
    malformedJsonForm.set("categoryIds", "[");
    malformedJsonForm.set("parentId", "");
    malformedJsonForm.set("type", "expense");

    expect(parseReorderCategoriesForm(malformedJsonForm)).toEqual({
      error: categoryErrorCodes.orderInvalid,
      ok: false,
    });

    const invalidIdForm = new FormData();
    invalidIdForm.set("categoryIds", JSON.stringify(["invalid-category-id"]));
    invalidIdForm.set("parentId", "");
    invalidIdForm.set("type", "expense");

    expect(parseReorderCategoriesForm(invalidIdForm)).toEqual({
      error: categoryErrorCodes.orderInvalid,
      ok: false,
    });
  });

  it("排序表单正常时返回规范化参数", () => {
    const formData = new FormData();
    formData.set("categoryIds", JSON.stringify([categoryId, secondCategoryId]));
    formData.set("parentId", "");
    formData.set("type", "income");

    expect(parseReorderCategoriesForm(formData)).toEqual({
      ok: true,
      value: {
        categoryIds: [categoryId, secondCategoryId],
        parentId: null,
        type: "income",
      },
    });
  });
});
