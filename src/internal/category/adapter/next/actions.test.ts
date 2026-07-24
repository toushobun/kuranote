// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { categoryErrorCodes } from "internal/category/categoryErrors";
import {
  ConflictError,
  NotFoundError,
  RepositoryError,
} from "internal/shared/errors/appError";
import type { CategoryActionState } from "types/categories";

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
vi.mock("internal/category/adapter/next/revalidate", () => ({
  revalidateCategoryMutation: mocks.revalidateCategoryMutation,
}));
vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  requireCurrentUserAndLedger: mocks.requireCurrentUserAndLedger,
}));
vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));
vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));

import {
  archiveCategory,
  createCategory,
  reorderCategories,
  updateCategory,
} from "internal/category/adapter/next/actions";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const categoryId = "00000000-0000-4000-8000-000000000101";

function createCreateFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("iconName", "🍽️");
  formData.set("name", "餐饮");
  formData.set("parentId", "");
  formData.set("type", "expense");

  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }

  return formData;
}

function createUpdateFormData() {
  const formData = new FormData();
  formData.set("categoryId", categoryId);
  formData.set("iconName", "🍜");
  formData.set("name", "外食");
  return formData;
}

function createArchiveFormData() {
  const formData = new FormData();
  formData.set("categoryId", categoryId);
  return formData;
}

function createReorderFormData() {
  const formData = new FormData();
  formData.set("categoryIds", JSON.stringify([categoryId]));
  formData.set("parentId", "");
  formData.set("type", "expense");
  return formData;
}

function expectErrorState(state: CategoryActionState, message: string) {
  expect(state).toEqual({
    error: message,
    errorKey: expect.any(String),
  });
}

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
    await expect(createCategory({}, createCreateFormData())).rejects.toThrow(
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

  it("创建表单无效时返回安全错误状态", async () => {
    const state = await createCategory(
      {},
      createCreateFormData({ name: "" }),
    );

    expectErrorState(state, "请输入分类名称。");
    expect(mocks.createServerRequestDependencies).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("创建 Service 失败时保留应用异常 message", async () => {
    mocks.create.mockRejectedValue(
      new ConflictError(
        categoryErrorCodes.createFailed,
        "分类新增失败。请确认分类名称是否重复，或稍后重试。",
      ),
    );

    const state = await createCategory({}, createCreateFormData());

    expectErrorState(
      state,
      "分类新增失败。请确认分类名称是否重复，或稍后重试。",
    );
    expect(mocks.revalidateCategoryMutation).not.toHaveBeenCalled();
  });

  it("未知异常时记录安全日志并返回对应操作提示", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.update.mockRejectedValue(new Error("database unavailable"));

    const state = await updateCategory({}, createUpdateFormData());

    expectErrorState(
      state,
      "分类更新失败。请确认分类名称是否重复，或稍后重试。",
    );
    expect(consoleError).toHaveBeenCalledWith(
      "[category] update failed unexpectedly",
      { errorName: "Error" },
    );
    consoleError.mockRestore();
  });

  it("编辑和隐藏成功时共用 Category Service 与缓存失效函数", async () => {
    await expect(updateCategory({}, createUpdateFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/categories",
    );
    await expect(archiveCategory({}, createArchiveFormData())).rejects.toThrow(
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

  it.each([
    [
      new RepositoryError(categoryErrorCodes.reorderFailed, "排序失败"),
      "排序失败",
    ],
    [
      new ConflictError(
        categoryErrorCodes.reorderConflict,
        "分类列表已发生变化，请刷新页面后重试。",
      ),
      "分类列表已发生变化，请刷新页面后重试。",
    ],
    [
      new NotFoundError(
        categoryErrorCodes.ledgerInvalid,
        "账本不存在或已归档。",
      ),
      "账本不存在或已归档。",
    ],
  ])("排序失败时返回 Service message 且不失效缓存", async (error, message) => {
    mocks.reorder.mockRejectedValue(error);

    const state = await reorderCategories(createReorderFormData());

    expectErrorState(state, message);
    expect(mocks.revalidateCategoryMutation).not.toHaveBeenCalled();
  });

  it("排序成功后复用模块级缓存失效函数且不跳转", async () => {
    await expect(reorderCategories(createReorderFormData())).resolves.toEqual(
      {},
    );
    expect(mocks.revalidateCategoryMutation).toHaveBeenCalledOnce();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("登录跳转保持原有 Next.js 控制流", async () => {
    mocks.requireCurrentUserAndLedger.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/login"),
    );

    await expect(createCategory({}, createCreateFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/login",
    );
    expect(mocks.createServerRequestDependencies).not.toHaveBeenCalled();
  });
});
