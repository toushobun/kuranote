import { beforeEach, describe, expect, it, vi } from "vitest";

import { categoryErrorCodes } from "server/errors/categories";

import { reorderCategories } from "./categories";

const mocks = vi.hoisted(() => ({
  canManageMasterData: vi.fn(),
  redirect: vi.fn(),
  reorderCategoriesService: vi.fn(),
  requireCurrentUserAndLedger: vi.fn(),
  revalidatePath: vi.fn(),
  validateReorderCategoryForm: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("lib/ledger/permissions", () => ({
  canManageMasterData: mocks.canManageMasterData,
}));

vi.mock("server/context/currentLedger", () => ({
  requireCurrentUserAndLedger: mocks.requireCurrentUserAndLedger,
}));

vi.mock("server/services/categories", () => ({
  archiveCategoryService: vi.fn(),
  createCategoryService: vi.fn(),
  reorderCategoriesService: mocks.reorderCategoriesService,
  updateCategoryService: vi.fn(),
}));

vi.mock("server/validators/categories", () => ({
  validateArchiveCategoryForm: vi.fn(),
  validateCreateCategoryForm: vi.fn(),
  validateReorderCategoryForm: mocks.validateReorderCategoryForm,
  validateUpdateCategoryForm: vi.fn(),
}));

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const categoryIds = [
  "00000000-0000-4000-8000-000000000101",
  "00000000-0000-4000-8000-000000000102",
];

function createFormData() {
  const formData = new FormData();
  formData.set("categoryIds", JSON.stringify(categoryIds));
  formData.set("parentId", "");
  formData.set("type", "expense");
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.canManageMasterData.mockReturnValue(true);
  mocks.requireCurrentUserAndLedger.mockResolvedValue({
    currentLedger: { id: ledgerId, currentUserRole: "owner" },
    userId,
  });
  mocks.validateReorderCategoryForm.mockReturnValue({
    ok: true,
    value: { categoryIds, parentId: null, type: "expense" },
  });
  mocks.reorderCategoriesService.mockResolvedValue({ ok: true });
});

describe("reorderCategories", () => {
  it("没有分类管理权限时返回 permission_denied", async () => {
    mocks.canManageMasterData.mockReturnValue(false);

    await expect(reorderCategories(createFormData())).resolves.toEqual({
      error: categoryErrorCodes.permissionDenied,
      ok: false,
    });

    expect(mocks.validateReorderCategoryForm).not.toHaveBeenCalled();
    expect(mocks.reorderCategoriesService).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("排序表单校验失败时直接返回错误", async () => {
    mocks.validateReorderCategoryForm.mockReturnValue({
      error: categoryErrorCodes.orderInvalid,
      ok: false,
    });

    await expect(reorderCategories(createFormData())).resolves.toEqual({
      error: categoryErrorCodes.orderInvalid,
      ok: false,
    });

    expect(mocks.reorderCategoriesService).not.toHaveBeenCalled();
  });

  it("排序失败时保留服务端恢复结果", async () => {
    mocks.reorderCategoriesService.mockResolvedValue({
      error: categoryErrorCodes.reorderFailed,
      ok: false,
      recoveryFailed: true,
    });

    await expect(reorderCategories(createFormData())).resolves.toEqual({
      error: categoryErrorCodes.reorderFailed,
      ok: false,
      recoveryFailed: true,
    });
  });

  it("排序成功后刷新缓存但不跳转页面", async () => {
    await expect(reorderCategories(createFormData())).resolves.toEqual({
      ok: true,
    });

    expect(mocks.reorderCategoriesService).toHaveBeenCalledWith({
      categoryIds,
      ledgerId,
      parentId: null,
      type: "expense",
      userId,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/categories");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
