// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { merchantErrorCodes } from "internal/merchant/errors";
import {
  ConflictError,
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";
import type { MerchantActionState, MerchantStateAction } from "types/merchants";

const mocks = vi.hoisted(() => ({
  archiveAlias: vi.fn(),
  archiveMerchant: vi.fn(),
  archiveTag: vi.fn(),
  cacheMerchantIcon: vi.fn(),
  createAlias: vi.fn(),
  createMerchant: vi.fn(),
  createTag: vi.fn(),
  fetchMerchantIcon: vi.fn(),
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  redirect: vi.fn(),
  requireCurrentUserAndLedger: vi.fn(),
  revalidateMerchantMutation: vi.fn(),
  reorderTags: vi.fn(),
  updateMerchant: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  requireCurrentUserAndLedger: mocks.requireCurrentUserAndLedger,
}));
vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));
vi.mock("internal/merchant/adapter/next/revalidate", () => ({
  revalidateMerchantMutation: mocks.revalidateMerchantMutation,
}));
vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));

import {
  archiveMerchant,
  archiveMerchantAlias,
  archiveMerchantTag,
  createMerchant,
  createMerchantAlias,
  createMerchantTag,
  fetchMerchantIcon,
  reorderMerchantTags,
  updateMerchant,
  updateMerchantTag,
} from "internal/merchant/adapter/next/actions";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const merchantId = "00000000-0000-4000-8000-000000001001";
const aliasId = "00000000-0000-4000-8000-000000001002";
const tagId = "00000000-0000-4000-8000-000000002001";

function merchantForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("merchantId", merchantId);
  formData.set("aliasId", aliasId);
  formData.set("alias", "来福");
  formData.set("name", "LIFE");
  formData.set("websiteUrl", "https://example.com");
  formData.set("note", "常用超市");
  formData.set("icon", "🛒");
  formData.set("tagId", tagId);
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

function runAction(
  action: MerchantStateAction,
  formData = merchantForm(),
): Promise<MerchantActionState> {
  return action({}, formData);
}

function expectErrorState(state: MerchantActionState, message: string) {
  expect(state).toEqual({
    error: message,
    errorKey: expect.any(String),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.archiveAlias.mockResolvedValue(merchantId);
  mocks.cacheMerchantIcon.mockResolvedValue({
    url: "https://t2.gstatic.com/faviconV2?url=https://example.com",
  });
  mocks.fetchMerchantIcon.mockResolvedValue({
    url: "https://t2.gstatic.com/faviconV2?url=https://example.com",
  });
  mocks.redirect.mockImplementation((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  });
  mocks.requireCurrentUserAndLedger.mockResolvedValue({
    currentLedger: { id: ledgerId },
  });
  mocks.createServerRequestDependencies.mockResolvedValue({});
  mocks.createRequestContainer.mockReturnValue({
    merchant: {
      service: {
        archiveAlias: mocks.archiveAlias,
        archiveMerchant: mocks.archiveMerchant,
        archiveTag: mocks.archiveTag,
        cacheMerchantIcon: mocks.cacheMerchantIcon,
        createAlias: mocks.createAlias,
        createMerchant: mocks.createMerchant,
        createTag: mocks.createTag,
        fetchMerchantIcon: mocks.fetchMerchantIcon,
        findSummariesByIds: vi.fn(),
        listActiveOptions: vi.fn(),
        reorderTags: mocks.reorderTags,
        updateMerchant: mocks.updateMerchant,
        updateTag: mocks.updateTag,
      },
    },
  });
});

describe("Merchant Server Actions", () => {
  it("编辑页手动获取图标时校验当前账本并缓存", async () => {
    const state = await fetchMerchantIcon({}, merchantForm());

    expect(state).toEqual({
      iconUrl: "https://t2.gstatic.com/faviconV2?url=https://example.com",
      success: "网站图标已缓存",
    });
    expect(mocks.cacheMerchantIcon).toHaveBeenCalledWith({
      ledgerId,
      merchantId,
      websiteUrl: "https://example.com",
    });
    expect(mocks.revalidateMerchantMutation).toHaveBeenCalledOnce();
  });

  it("新增页手动获取只返回预览，保存商家时再落库", async () => {
    const formData = merchantForm({ merchantId: "" });

    const state = await fetchMerchantIcon({}, formData);

    expect(state).toEqual({
      iconUrl: "https://t2.gstatic.com/faviconV2?url=https://example.com",
      success: "网站图标已获取，保存商家后会缓存",
    });
    expect(mocks.fetchMerchantIcon).toHaveBeenCalledWith({
      ledgerId,
      websiteUrl: "https://example.com",
    });
    expect(mocks.revalidateMerchantMutation).not.toHaveBeenCalled();
  });

  it.each([
    {
      action: createMerchant,
      expected: "请输入商家名称。",
      formData: merchantForm({ name: "" }),
      name: "新增商家",
    },
    {
      action: updateMerchant,
      expected: "商家指定不正确。",
      formData: merchantForm({ merchantId: "invalid" }),
      name: "更新商家",
    },
    {
      action: archiveMerchant,
      expected: "商家指定不正确。",
      formData: merchantForm({ merchantId: "invalid" }),
      name: "归档商家",
    },
    {
      action: createMerchantAlias,
      expected: "请输入商家别名。",
      formData: merchantForm({ alias: "" }),
      name: "新增别名",
    },
    {
      action: archiveMerchantAlias,
      expected: "商家别名指定不正确。",
      formData: merchantForm({ aliasId: "invalid" }),
      name: "归档别名",
    },
  ])(
    "$name 校验失败时返回 inline error state",
    async ({ action, expected, formData }) => {
      const state = await runAction(action, formData);

      expectErrorState(state, expected);
      expect(mocks.createServerRequestDependencies).not.toHaveBeenCalled();
      expect(mocks.revalidateMerchantMutation).not.toHaveBeenCalled();
      expect(mocks.redirect).not.toHaveBeenCalled();
    },
  );

  it("已知 AppError 返回可直接展示的安全文案", async () => {
    mocks.updateMerchant.mockRejectedValue(
      new RepositoryError(
        merchantErrorCodes.updateFailed,
        "商家更新失败，请稍后重试。",
      ),
    );

    const state = await runAction(updateMerchant);

    expectErrorState(state, "商家更新失败，请稍后重试。");
    expect(mocks.revalidateMerchantMutation).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("标签排序时账本状态竞争返回具体安全文案", async () => {
    mocks.reorderTags.mockRejectedValue(
      new ConflictError(
        merchantErrorCodes.ledgerInvalid,
        "账本不存在、已停用或您无法访问。",
      ),
    );
    const formData = merchantForm();
    formData.set("tagIds", JSON.stringify([tagId]));

    const state = await reorderMerchantTags(formData);

    expectErrorState(state, "账本不存在、已停用或您无法访问。");
    expect(mocks.revalidateMerchantMutation).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("未知异常记录安全日志并返回通用文案", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.createMerchant.mockRejectedValue(
      new Error("password=secret database unavailable"),
    );

    const state = await runAction(createMerchant);

    expectErrorState(
      state,
      "商家新增失败。请确认商家名称是否重复，或稍后重试。",
    );
    expect(JSON.stringify(state)).not.toContain("password");
    expect(JSON.stringify(state)).not.toContain("database");
    expect(consoleError).toHaveBeenCalledWith(
      "[merchant] create action failed unexpectedly",
      { errorName: "Error" },
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("secret");
    expect(mocks.revalidateMerchantMutation).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("跨模块 AppError 不转发敏感文案并返回当前操作 fallback", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.updateMerchant.mockRejectedValue(
      new ValidationError(
        "account_name_required",
        "password=secret database connection failed",
      ),
    );

    const state = await runAction(updateMerchant);

    expectErrorState(
      state,
      "商家更新失败。请确认商家名称是否重复，或稍后重试。",
    );
    expect(JSON.stringify(state)).not.toContain("secret");
    expect(JSON.stringify(state)).not.toContain("database");
    expect(consoleError).toHaveBeenCalledWith(
      "[merchant] update action failed unexpectedly",
      { errorName: "ValidationError" },
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("secret");
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("database");
    expect(mocks.revalidateMerchantMutation).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("依赖初始化失败时返回安全提示且不调用 Service", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.createServerRequestDependencies.mockRejectedValueOnce(
      new Error("connection string"),
    );

    const state = await runAction(archiveMerchant);

    expectErrorState(state, "商家归档失败，请稍后重试。");
    expect(mocks.createRequestContainer).not.toHaveBeenCalled();
    expect(mocks.archiveMerchant).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "[merchant] archive action failed unexpectedly",
      { errorName: "Error" },
    );
    consoleError.mockRestore();
  });

  it("Container 初始化失败时返回安全提示", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.createRequestContainer.mockImplementationOnce(() => {
      throw new Error("container unavailable");
    });

    const state = await runAction(createMerchantAlias);

    expectErrorState(
      state,
      "商家别名新增失败。请确认别名是否重复，或稍后重试。",
    );
    expect(mocks.createAlias).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "[merchant] create alias action failed unexpectedly",
      { errorName: "Error" },
    );
    consoleError.mockRestore();
  });

  it("登录跳转保持 Next.js 原有控制流", async () => {
    mocks.requireCurrentUserAndLedger.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/login"),
    );

    await expect(runAction(createMerchant)).rejects.toThrow(
      "NEXT_REDIRECT:/login",
    );
    expect(mocks.createServerRequestDependencies).not.toHaveBeenCalled();
    expect(mocks.createMerchant).not.toHaveBeenCalled();
  });

  it("五个操作成功后均失效缓存并跳转到对应商家页面", async () => {
    for (const [action, path] of [
      [createMerchant, "/merchants"],
      [updateMerchant, `/merchants/${merchantId}/edit`],
      [archiveMerchant, "/merchants"],
      [createMerchantAlias, `/merchants/${merchantId}/edit`],
      [archiveMerchantAlias, `/merchants/${merchantId}/edit`],
    ] as const) {
      await expect(runAction(action)).rejects.toThrow(`NEXT_REDIRECT:${path}`);
    }

    expect(mocks.createMerchant).toHaveBeenCalledWith({
      ledgerId,
      name: "LIFE",
      note: "常用超市",
      siteUrl: "https://example.com",
      tagIds: [],
    });
    expect(mocks.updateMerchant).toHaveBeenCalledWith({
      ledgerId,
      merchantId,
      name: "LIFE",
      note: "常用超市",
      siteUrl: "https://example.com",
      tagIds: [],
    });
    expect(mocks.archiveMerchant).toHaveBeenCalledWith({
      ledgerId,
      merchantId,
    });
    expect(mocks.createAlias).toHaveBeenCalledWith({
      alias: "来福",
      ledgerId,
      merchantId,
    });
    expect(mocks.archiveAlias).toHaveBeenCalledWith({ aliasId, ledgerId });
    expect(mocks.revalidateMerchantMutation).toHaveBeenCalledTimes(5);
    expect(mocks.redirect).toHaveBeenCalledTimes(5);
  });

  it("连续相同错误生成不同 errorKey", async () => {
    const firstState = await runAction(
      createMerchant,
      merchantForm({ name: "" }),
    );
    const secondState = await runAction(
      createMerchant,
      merchantForm({ name: "" }),
    );

    expect(firstState.error).toBe(secondState.error);
    expect(firstState.errorKey).toEqual(expect.any(String));
    expect(secondState.errorKey).toEqual(expect.any(String));
    expect(firstState.errorKey).not.toBe(secondState.errorKey);
  });

  it("标签新增、更新、归档与排序成功后返回 inline 成功态并刷新页面", async () => {
    await expect(runAction(createMerchantTag)).resolves.toEqual({});
    await expect(runAction(updateMerchantTag)).resolves.toEqual({});
    await expect(runAction(archiveMerchantTag)).resolves.toEqual({});
    const reorderForm = merchantForm();
    reorderForm.set("tagIds", JSON.stringify([tagId]));
    await expect(reorderMerchantTags(reorderForm)).resolves.toEqual({});

    expect(mocks.createTag).toHaveBeenCalledWith({
      icon: "🛒",
      ledgerId,
      name: "LIFE",
    });
    expect(mocks.updateTag).toHaveBeenCalledWith({
      icon: "🛒",
      ledgerId,
      name: "LIFE",
      tagId,
    });
    expect(mocks.archiveTag).toHaveBeenCalledWith({ ledgerId, tagId });
    expect(mocks.reorderTags).toHaveBeenCalledWith({
      ledgerId,
      tagIds: [tagId],
    });
    expect(mocks.revalidateMerchantMutation).toHaveBeenCalledTimes(4);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
