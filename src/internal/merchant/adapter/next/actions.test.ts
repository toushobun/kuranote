// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  merchantErrorCodes,
  merchantErrorMessages,
  merchantWriteErrorMessages,
} from "internal/merchant/errors";
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
  createAlias: vi.fn(),
  createMerchant: vi.fn(),
  createTag: vi.fn(),
  fetchMerchantIcon: vi.fn(),
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  redirect: vi.fn(),
  requireCurrentUserAndLedger: vi.fn(),
  revalidateMerchantMutation: vi.fn(),
  setPreferredAlias: vi.fn(),
  reorderTags: vi.fn(),
  reorder: vi.fn(),
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
  setPreferredMerchantAlias,
  reorderMerchantTags,
  reorderMerchants,
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
        createAlias: mocks.createAlias,
        createMerchant: mocks.createMerchant,
        createTag: mocks.createTag,
        fetchMerchantIcon: mocks.fetchMerchantIcon,
        findSummariesByIds: vi.fn(),
        listActiveOptions: vi.fn(),
        setPreferredAlias: mocks.setPreferredAlias,
        reorderTags: mocks.reorderTags,
        reorder: mocks.reorder,
        updateMerchant: mocks.updateMerchant,
        updateTag: mocks.updateTag,
      },
    },
  });
});

describe("Merchant Server Actions", () => {
  it("编辑页手动获取图标时只返回预览且不写库", async () => {
    const state = await fetchMerchantIcon({}, merchantForm());

    expect(state).toEqual({
      iconUrl: "https://t2.gstatic.com/faviconV2?url=https://example.com",
      success: "网站图标已获取，保存后会缓存",
    });
    expect(mocks.fetchMerchantIcon).toHaveBeenCalledWith({
      ledgerId,
      websiteUrl: "https://example.com",
    });
    expect(mocks.revalidateMerchantMutation).not.toHaveBeenCalled();
  });

  it("新增页手动获取只返回预览，保存商家时再落库", async () => {
    const formData = merchantForm({ merchantId: "" });

    const state = await fetchMerchantIcon({}, formData);

    expect(state).toEqual({
      iconUrl: "https://t2.gstatic.com/faviconV2?url=https://example.com",
      success: "网站图标已获取，保存后会缓存",
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
      expected: merchantErrorMessages[merchantErrorCodes.nameRequired],
      formData: merchantForm({ name: "" }),
      name: "新增商家",
    },
    {
      action: updateMerchant,
      expected: merchantErrorMessages[merchantErrorCodes.merchantInvalid],
      formData: merchantForm({ merchantId: "invalid" }),
      name: "更新商家",
    },
    {
      action: archiveMerchant,
      expected: merchantErrorMessages[merchantErrorCodes.merchantInvalid],
      formData: merchantForm({ merchantId: "invalid" }),
      name: "归档商家",
    },
    {
      action: createMerchantAlias,
      expected: merchantErrorMessages[merchantErrorCodes.aliasRequired],
      formData: merchantForm({ alias: "" }),
      name: "新增别名",
    },
    {
      action: archiveMerchantAlias,
      expected: merchantErrorMessages[merchantErrorCodes.aliasInvalid],
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
        merchantWriteErrorMessages.updateFailed,
      ),
    );

    const state = await runAction(updateMerchant);

    expectErrorState(state, merchantWriteErrorMessages.updateFailed);
    expect(mocks.revalidateMerchantMutation).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("标签排序时账本状态竞争返回具体安全文案", async () => {
    mocks.reorderTags.mockRejectedValue(
      new ConflictError(
        merchantErrorCodes.ledgerInvalid,
        merchantErrorMessages[merchantErrorCodes.ledgerInvalid],
      ),
    );
    const formData = merchantForm();
    formData.set("tagIds", JSON.stringify([tagId]));

    const state = await reorderMerchantTags(formData);

    expectErrorState(
      state,
      merchantErrorMessages[merchantErrorCodes.ledgerInvalid],
    );
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
      merchantErrorMessages[merchantErrorCodes.createFailed],
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
      merchantErrorMessages[merchantErrorCodes.updateFailed],
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

    expectErrorState(
      state,
      merchantErrorMessages[merchantErrorCodes.archiveFailed],
    );
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
      merchantErrorMessages[merchantErrorCodes.aliasCreateFailed],
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

  it.each([
    {
      expected: "/transactions/new?type=expense",
      name: "合法 returnTo 时返回来源页面",
      returnTo: "/transactions/new?type=expense",
    },
    {
      expected: "/merchants?result=created",
      name: "站外 returnTo 时维持跳回商家列表",
      returnTo: "https://evil.example.com",
    },
    {
      expected: "/merchants?result=created",
      name: "协议相对 returnTo 时维持跳回商家列表",
      returnTo: "//evil.example.com",
    },
  ])("新增商家成功后$name", async ({ expected, returnTo }) => {
    await expect(
      runAction(createMerchant, merchantForm({ returnTo })),
    ).rejects.toThrow(`NEXT_REDIRECT:${expected}`);
  });

  it("商家操作成功后按流程导航或返回 inline 状态", async () => {
    for (const [action, path] of [
      [createMerchant, "/merchants?result=created"],
      [updateMerchant, "/merchants?result=updated"],
      [archiveMerchant, "/merchants?result=archived"],
    ] as const) {
      await expect(runAction(action)).rejects.toThrow(`NEXT_REDIRECT:${path}`);
    }

    await expect(runAction(createMerchantAlias)).resolves.toEqual({
      success: "添加成功",
    });
    await expect(runAction(archiveMerchantAlias)).resolves.toEqual({
      success: "删除成功",
    });

    expect(mocks.createMerchant).toHaveBeenCalledWith({
      ledgerId,
      name: "LIFE",
      note: "常用超市",
      previewIconUrl: null,
      siteUrl: "https://example.com",
      tagIds: [],
    });
    expect(mocks.updateMerchant).toHaveBeenCalledWith({
      ledgerId,
      merchantId,
      name: "LIFE",
      note: "常用超市",
      previewIconUrl: null,
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
    expect(mocks.revalidateMerchantMutation).toHaveBeenCalledWith(merchantId);
    expect(mocks.redirect).toHaveBeenCalledTimes(3);
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

describe("显示名切换", () => {
  it.each([aliasId, ""])(
    "切换成功返回 inline 提示且不导航：%s",
    async (value) => {
      expect(
        await runAction(
          setPreferredMerchantAlias,
          merchantForm({ aliasId: value }),
        ),
      ).toEqual({ success: "显示名切换成功" });
      expect(mocks.revalidateMerchantMutation).toHaveBeenCalledWith(merchantId);
      expect(mocks.setPreferredAlias).toHaveBeenCalledWith({
        ledgerId,
        merchantId,
        aliasId: value || null,
      });
      expect(mocks.revalidateMerchantMutation).toHaveBeenCalledOnce();
      expect(mocks.redirect).not.toHaveBeenCalled();
    },
  );

  it("校验失败不调用服务，业务失败保留安全消息", async () => {
    const invalid = await runAction(
      setPreferredMerchantAlias,
      merchantForm({ merchantId: "invalid" }),
    );
    expect(invalid.error).toBeTruthy();
    expect(mocks.setPreferredAlias).not.toHaveBeenCalled();
    mocks.setPreferredAlias.mockRejectedValue(
      new ValidationError(
        merchantErrorCodes.aliasPreferredUpdateFailed,
        "无法切换显示名",
      ),
    );
    expectErrorState(
      await runAction(setPreferredMerchantAlias),
      "无法切换显示名",
    );
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.revalidateMerchantMutation).not.toHaveBeenCalled();
  });
});

describe("reorderMerchants", () => {
  it("只使用服务端当前账本与会话身份并刷新页面缓存", async () => {
    const form = merchantForm({
      ledgerId: "forged-ledger",
      userId: "forged-user",
      role: "owner",
      merchantIds: JSON.stringify([merchantId]),
    });
    await expect(reorderMerchants(form)).resolves.toEqual({});
    expect(mocks.requireCurrentUserAndLedger).toHaveBeenCalledOnce();
    expect(mocks.reorder).toHaveBeenCalledWith({
      ledgerId,
      merchantIds: [merchantId],
    });
    expect(mocks.revalidateMerchantMutation).toHaveBeenCalledOnce();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it.each([
    "",
    "null",
    "{}",
    "[]",
    '["invalid"]',
    JSON.stringify([merchantId, merchantId]),
  ])("非法排序内容返回当前请求错误：%s", async (merchantIds) => {
    expectErrorState(
      await reorderMerchants(merchantForm({ merchantIds })),
      merchantErrorMessages[merchantErrorCodes.merchantOrderInvalid],
    );
    expect(mocks.reorder).not.toHaveBeenCalled();
  });
  it("排序失败返回安全文案和新的反馈标识且不导航", async () => {
    mocks.reorder.mockRejectedValue(
      new ConflictError(
        merchantErrorCodes.merchantSetInvalid,
        merchantErrorMessages[merchantErrorCodes.merchantSetInvalid],
      ),
    );
    const form = merchantForm({ merchantIds: JSON.stringify([merchantId]) });
    const first = await reorderMerchants(form);
    const second = await reorderMerchants(form);
    expectErrorState(
      first,
      merchantErrorMessages[merchantErrorCodes.merchantSetInvalid],
    );
    expect(first.errorKey).not.toBe(second.errorKey);
    expect(mocks.revalidateMerchantMutation).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
