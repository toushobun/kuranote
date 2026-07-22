// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { categoryErrorCodes } from "server/category/categoryErrors";
import { RepositoryError } from "server/shared/errors/appError";

const mocks = vi.hoisted(() => ({
  archive: vi.fn(),
  create: vi.fn(),
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  redirect: vi.fn(),
  reorder: vi.fn(),
  requireCurrentUserAndLedger: vi.fn(),
  revalidateCategoryMutation: vi.fn(),
  update: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("server/category/adapter/next/revalidate", () => ({
  revalidateCategoryMutation: mocks.revalidateCategoryMutation,
}));
vi.mock("server/context/currentLedger", () => ({
  requireCurrentUserAndLedger: mocks.requireCurrentUserAndLedger,
}));
vi.mock("server/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));
vi.mock("server/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));

import {
  archiveCategory,
  createCategory,
  reorderCategories,
  updateCategory,
} from "server/category/adapter/next/actions";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const categoryId = "00000000-0000-4000-8000-000000000101";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.redirect.mockImplementation((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  });
  mocks.requireCurrentUserAndLedger.mockResolvedValue({
    currentLedger: { id: ledgerId },
    userId,
  });
  mocks.createServerRequestDependencies.mockResolvedValue({});
  mocks.createRequestContainer.mockReturnValue({
    category: {
      service: {
        archive: mocks.archive,
        create: mocks.create,
        getCategoriesView: vi.fn(),
        reorder: mocks.reorder,
        update: mocks.update,
      },
    },
  });
});

describe("Category Server Actions", () => {
  it("创建成功后调用模块级缓存失效并跳回分类页", async () => {
    const formData = new FormData();
    formData.set("iconName", "🍽️");
    formData.set("name", "餐饮");
    formData.set("parentId", "");
    formData.set("type", "expense");

    await expect(createCategory(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/categories",
    );

    expect(mocks.create).toHaveBeenCalledWith({
      iconName: "🍽️",
      ledgerId,
      name: "餐饮",
      parentId: null,
      type: "expense",
      userId,
    });
    expect(mocks.revalidateCategoryMutation).toHaveBeenCalledOnce();
  });

  it("创建表单无效时不创建请求依赖也不触发缓存失效", async () => {
    const formData = new FormData();
    formData.set("iconName", "🍽️");
    formData.set("name", "");
    formData.set("type", "expense");

    await expect(createCategory(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/categories?error=name_required",
    );

    expect(mocks.createServerRequestDependencies).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.revalidateCategoryMutation).not.toHaveBeenCalled();
  });

  it("编辑和归档成功时共用 Category Service 与缓存失效函数", async () => {
    const updateForm = new FormData();
    updateForm.set("categoryId", categoryId);
    updateForm.set("iconName", "🍜");
    updateForm.set("name", "外食");

    await expect(updateCategory(updateForm)).rejects.toThrow(
      "NEXT_REDIRECT:/categories",
    );

    const archiveForm = new FormData();
    archiveForm.set("categoryId", categoryId);

    await expect(archiveCategory(archiveForm)).rejects.toThrow(
      "NEXT_REDIRECT:/categories",
    );

    expect(mocks.update).toHaveBeenCalledWith({
      categoryId,
      iconName: "🍜",
      ledgerId,
      name: "外食",
      userId,
    });
    expect(mocks.archive).toHaveBeenCalledWith({
      categoryId,
      ledgerId,
      userId,
    });
    expect(mocks.revalidateCategoryMutation).toHaveBeenCalledTimes(2);
  });

  it("排序失败时返回 Service 错误且不失效缓存", async () => {
    mocks.reorder.mockRejectedValue(
      new RepositoryError(categoryErrorCodes.reorderFailed, "排序失败"),
    );
    const formData = new FormData();
    formData.set("categoryIds", JSON.stringify([categoryId]));
    formData.set("parentId", "");
    formData.set("type", "expense");

    await expect(reorderCategories(formData)).resolves.toEqual({
      error: categoryErrorCodes.reorderFailed,
      ok: false,
    });
    expect(mocks.revalidateCategoryMutation).not.toHaveBeenCalled();
  });

  it("排序成功后复用同一模块级缓存失效函数且不跳转", async () => {
    const formData = new FormData();
    formData.set("categoryIds", JSON.stringify([categoryId]));
    formData.set("parentId", "");
    formData.set("type", "expense");

    await expect(reorderCategories(formData)).resolves.toEqual({ ok: true });
    expect(mocks.revalidateCategoryMutation).toHaveBeenCalledOnce();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
