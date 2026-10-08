// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ledgerAccessErrorMessages } from "internal/ledger/errors/ledgerAccess";
import {
  ledgerInviteErrorCodes,
  ledgerInviteErrorMessages,
} from "internal/ledger/errors/ledgerInvite";
import {
  ledgerCreateErrorCodes,
  ledgerCreateErrorMessages,
} from "internal/ledger/errors/ledgerCreate";
import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
  ledgerSetupLoadErrorMessages,
  ledgerSetupWriteErrorMessages,
  type LedgerSetupErrorCode,
} from "internal/ledger/errors/ledgerSetup";
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";
import {
  createLedgerSetupProgressFixture,
  ledgerSetupFixtureId,
} from "test/mocks/ledgerSetup";
import type {
  CompleteLedgerSetupInput,
  LedgerSetupBasicInfoActionState,
  SaveLedgerSetupDraftInput,
} from "types/ledgers";

import {
  completeLedgerSetup,
  loadLedgerSetupInviteMembers,
  loadLedgerSetupWizardView,
  saveLedgerSetupDraft,
  submitLedgerSetupBasicInfo,
} from "./ledgerSetup";

const mocks = vi.hoisted(() => ({
  complete: vi.fn(),
  create: vi.fn(),
  createDependencies: vi.fn(),
  getCreateDefaults: vi.fn(),
  getCurrentLedgerContext: vi.fn(),
  getCurrentUserSetup: vi.fn(),
  getTemplate: vi.fn(),
  listDefaultRootCategoryNames: vi.fn(),
  listPendingInvites: vi.fn(),
  listUnclaimedPlaceholders: vi.fn(),
  revalidateLedgerMutation: vi.fn(),
  saveDraft: vi.fn(),
  updateBasicInfo: vi.fn(),
}));

vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  getCurrentLedgerContext: mocks.getCurrentLedgerContext,
}));

vi.mock("internal/ledger/adapter/next/revalidateLedger", () => ({
  revalidateLedgerMutation: mocks.revalidateLedgerMutation,
}));

vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createDependencies,
}));

vi.mock("internal/container", () => ({
  createRequestContainer: () => ({
    ledger: {
      inviteService: { listPending: mocks.listPendingInvites },
      service: { getCreateDefaults: mocks.getCreateDefaults },
      placeholderMemberService: {
        listUnclaimed: mocks.listUnclaimedPlaceholders,
      },
      setupService: {
        complete: mocks.complete,
        create: mocks.create,
        getCurrentUserSetup: mocks.getCurrentUserSetup,
        getTemplate: mocks.getTemplate,
        listDefaultRootCategoryNames: mocks.listDefaultRootCategoryNames,
        saveDraft: mocks.saveDraft,
        updateBasicInfo: mocks.updateBasicInfo,
      },
    },
  }),
}));

const basicInfo = {
  baseCurrency: "JPY",
  displayColor: "amber",
  displayName: "淞文",
  ledgerName: "家庭账本",
};

const progress = createLedgerSetupProgressFixture();

function createFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();

  formData.set("baseCurrency", basicInfo.baseCurrency);
  formData.set("ledgerName", basicInfo.ledgerName);
  formData.set("memberDisplayColor", basicInfo.displayColor);
  formData.set("memberDisplayName", basicInfo.displayName);

  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }

  return formData;
}

function runAction(formData: FormData) {
  return submitLedgerSetupBasicInfo({}, formData);
}

/** 与 ledgerSetupService 相同语义的应用错误。 */
function createSetupError(code: LedgerSetupErrorCode) {
  const message = ledgerSetupErrorMessages[code];

  if (code === ledgerSetupErrorCodes.notFound) {
    return new NotFoundError(code, message);
  }

  return code === ledgerSetupErrorCodes.accountNameDuplicate ||
    code === ledgerSetupErrorCodes.payloadInvalid
    ? new ValidationError(code, message)
    : new ConflictError(code, message);
}

function expectErrorState(
  state: Pick<LedgerSetupBasicInfoActionState, "error" | "errorKey">,
  message: string,
) {
  expect(state).toEqual({ error: message, errorKey: expect.any(String) });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createDependencies.mockResolvedValue({});
  mocks.getCurrentLedgerContext.mockResolvedValue({
    currentLedger: null,
    email: "user@example.com",
    ledgers: [],
    userId: "00000000-0000-4000-8000-000000000031",
  });
  mocks.create.mockResolvedValue({ ledgerId: ledgerSetupFixtureId });
  mocks.updateBasicInfo.mockResolvedValue(undefined);
  mocks.saveDraft.mockResolvedValue(undefined);
  mocks.complete.mockResolvedValue(undefined);
  mocks.getCurrentUserSetup.mockResolvedValue(progress.setup);
  mocks.getTemplate.mockReturnValue(null);
});

describe("submitLedgerSetupBasicInfo", () => {
  it("尚无创建中账本时创建账本并返回最新进度", async () => {
    const state = await runAction(createFormData());

    expect(mocks.create).toHaveBeenCalledWith(basicInfo);
    expect(mocks.updateBasicInfo).not.toHaveBeenCalled();
    expect(mocks.getTemplate).toHaveBeenCalledWith("JPY");
    expect(state).toEqual({ progress });
    expect(mocks.revalidateLedgerMutation).toHaveBeenCalledWith();
  });

  it("已有创建中账本时更新基本信息", async () => {
    const state = await runAction(
      createFormData({ ledgerId: ledgerSetupFixtureId }),
    );

    expect(mocks.updateBasicInfo).toHaveBeenCalledWith({
      ...basicInfo,
      ledgerId: ledgerSetupFixtureId,
    });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(state).toEqual({ progress });
  });

  it("表单校验失败时返回账本创建的权威文案且不调用 Service", async () => {
    const state = await runAction(createFormData({ ledgerName: "" }));

    expectErrorState(
      state,
      ledgerCreateErrorMessages[ledgerCreateErrorCodes.nameRequired],
    );
    expect(mocks.createDependencies).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("账本 ID 不正确时返回创建中账本不存在的文案", async () => {
    const state = await runAction(createFormData({ ledgerId: "invalid" }));

    expectErrorState(
      state,
      ledgerSetupErrorMessages[ledgerSetupErrorCodes.notFound],
    );
    expect(mocks.updateBasicInfo).not.toHaveBeenCalled();
  });

  it("已存在创建中账本时返回该账本进度用于恢复，不返回失败", async () => {
    mocks.create.mockRejectedValue(
      new ConflictError(
        ledgerSetupErrorCodes.inProgressExists,
        ledgerSetupErrorMessages[ledgerSetupErrorCodes.inProgressExists],
      ),
    );

    const state = await runAction(createFormData());

    expect(state).toEqual({ progress, restored: true });
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it("已存在创建中账本但重新读取不到时返回冲突文案", async () => {
    mocks.create.mockRejectedValue(
      new ConflictError(
        ledgerSetupErrorCodes.inProgressExists,
        ledgerSetupErrorMessages[ledgerSetupErrorCodes.inProgressExists],
      ),
    );
    mocks.getCurrentUserSetup.mockResolvedValue(null);

    const state = await runAction(createFormData());

    expectErrorState(
      state,
      ledgerSetupErrorMessages[ledgerSetupErrorCodes.inProgressExists],
    );
  });

  it("Service 返回应用异常时保留对应安全文案", async () => {
    mocks.updateBasicInfo.mockRejectedValue(
      new ValidationError(
        ledgerCreateErrorCodes.currencyInvalid,
        ledgerCreateErrorMessages[ledgerCreateErrorCodes.currencyInvalid],
      ),
    );

    const state = await runAction(
      createFormData({ ledgerId: ledgerSetupFixtureId }),
    );

    expectErrorState(
      state,
      ledgerCreateErrorMessages[ledgerCreateErrorCodes.currencyInvalid],
    );
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it("写入后读取不到创建中账本时返回不存在文案", async () => {
    mocks.getCurrentUserSetup.mockResolvedValue(null);

    const state = await runAction(createFormData());

    expectErrorState(
      state,
      ledgerSetupErrorMessages[ledgerSetupErrorCodes.notFound],
    );
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it.each([
    ["创建", {}, ledgerSetupWriteErrorMessages.createFailed],
    [
      "更新",
      { ledgerId: ledgerSetupFixtureId },
      ledgerSetupWriteErrorMessages.basicInfoUpdateFailed,
    ],
  ])(
    "%s时发生未知异常记录安全日志并返回通用提示",
    async (_label, overrides, message) => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mocks.create.mockRejectedValue(new Error("database unavailable"));
      mocks.updateBasicInfo.mockRejectedValue(
        new Error("database unavailable"),
      );

      const state = await runAction(createFormData(overrides));

      expectErrorState(state, message);
      expect(consoleError).toHaveBeenCalledWith(
        "[ledger] ledger setup basic info action failed unexpectedly",
        { errorName: "Error" },
      );
      consoleError.mockRestore();
    },
  );

  it("登录跳转保持原有 Next.js 控制流", async () => {
    mocks.getCurrentLedgerContext.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/login"),
    );

    await expect(runAction(createFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/login",
    );
    expect(mocks.createDependencies).not.toHaveBeenCalled();
  });
});

describe("saveLedgerSetupDraft", () => {
  const draftInput: SaveLedgerSetupDraftInput = {
    draft: progress.setup.draft,
    ledgerId: ledgerSetupFixtureId,
    step: 3,
  };

  it("保存草稿与步骤后返回重新读取的进度", async () => {
    const state = await saveLedgerSetupDraft(draftInput);

    expect(mocks.saveDraft).toHaveBeenCalledWith(draftInput);
    expect(state).toEqual({ progress });
    expect(mocks.revalidateLedgerMutation).toHaveBeenCalledWith();
  });

  it.each([
    ["非 UUID", { ...draftInput, ledgerId: "invalid" }],
    ["缺失", { draft: draftInput.draft, step: 3 }],
  ])("账本 ID %s时返回不存在文案且不调用 Service", async (_label, input) => {
    const state = await saveLedgerSetupDraft(
      input as SaveLedgerSetupDraftInput,
    );

    expectErrorState(
      state,
      ledgerSetupErrorMessages[ledgerSetupErrorCodes.notFound],
    );
    expect(mocks.createDependencies).not.toHaveBeenCalled();
    expect(mocks.saveDraft).not.toHaveBeenCalled();
  });

  it.each([
    ledgerSetupErrorCodes.draftInvalid,
    ledgerSetupErrorCodes.stepInvalid,
    ledgerSetupErrorCodes.draftTooLarge,
    ledgerSetupErrorCodes.notInProgress,
  ])("草稿校验或保存失败（%s）时返回对应安全文案", async (code) => {
    mocks.saveDraft.mockRejectedValue(createSetupError(code));

    const state = await saveLedgerSetupDraft(draftInput);

    expectErrorState(state, ledgerSetupErrorMessages[code]);
    expect(state).not.toHaveProperty("accountNameDuplicate");
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it("同类型账户重名时返回重名标记与对应文案", async () => {
    mocks.saveDraft.mockRejectedValue(
      createSetupError(ledgerSetupErrorCodes.accountNameDuplicate),
    );

    const state = await saveLedgerSetupDraft(draftInput);

    expect(state).toEqual({
      accountNameDuplicate: true,
      error:
        ledgerSetupErrorMessages[ledgerSetupErrorCodes.accountNameDuplicate],
      errorKey: expect.any(String),
    });
  });

  it.each([
    ledgerSetupErrorCodes.templateOutdated,
    ledgerSetupErrorCodes.currencyMismatch,
  ])("%s 时重新读取进度并返回 outdated，不作为失败", async (code) => {
    mocks.saveDraft.mockRejectedValue(createSetupError(code));

    const state = await saveLedgerSetupDraft(draftInput);

    expect(state).toEqual({ outdated: true, progress });
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it("预设内容已更新但重新读取不到创建中账本时返回不存在文案", async () => {
    mocks.saveDraft.mockRejectedValue(
      createSetupError(ledgerSetupErrorCodes.templateOutdated),
    );
    mocks.getCurrentUserSetup.mockResolvedValue(null);

    const state = await saveLedgerSetupDraft(draftInput);

    expectErrorState(
      state,
      ledgerSetupErrorMessages[ledgerSetupErrorCodes.notFound],
    );
  });

  it("保存后读取不到创建中账本时返回不存在文案", async () => {
    mocks.getCurrentUserSetup.mockResolvedValue(null);

    const state = await saveLedgerSetupDraft(draftInput);

    expectErrorState(
      state,
      ledgerSetupErrorMessages[ledgerSetupErrorCodes.notFound],
    );
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it("未知异常记录安全日志并返回草稿保存失败的通用提示", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.saveDraft.mockRejectedValue(new Error("database unavailable"));

    const state = await saveLedgerSetupDraft(draftInput);

    expectErrorState(state, ledgerSetupWriteErrorMessages.draftSaveFailed);
    expect(consoleError).toHaveBeenCalledWith(
      "[ledger] ledger setup draft action failed unexpectedly",
      { errorName: "Error" },
    );
    consoleError.mockRestore();
  });

  it("登录跳转保持原有 Next.js 控制流", async () => {
    mocks.getCurrentLedgerContext.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/login"),
    );

    await expect(saveLedgerSetupDraft(draftInput)).rejects.toThrow(
      "NEXT_REDIRECT:/login",
    );
    expect(mocks.saveDraft).not.toHaveBeenCalled();
  });
});

describe("completeLedgerSetup", () => {
  const completeInput: CompleteLedgerSetupInput = {
    ledgerId: ledgerSetupFixtureId,
  };

  it("完成写入后刷新依赖当前账本的页面并返回成功", async () => {
    const state = await completeLedgerSetup(completeInput);

    expect(mocks.complete).toHaveBeenCalledWith(ledgerSetupFixtureId);
    expect(state).toEqual({ completed: true });
    expect(mocks.revalidateLedgerMutation).toHaveBeenCalledWith();
  });

  it.each([
    ["非 UUID", { ledgerId: "invalid" }],
    ["缺失", {}],
  ])(
    "账本 ID %s时返回不存在文案与 notFound，且不调用 Service",
    async (_label, input) => {
      const state = await completeLedgerSetup(
        input as CompleteLedgerSetupInput,
      );

      expect(state).toEqual({
        error: ledgerSetupErrorMessages[ledgerSetupErrorCodes.notFound],
        errorKey: expect.any(String),
        notFound: true,
      });
      expect(mocks.createDependencies).not.toHaveBeenCalled();
      expect(mocks.complete).not.toHaveBeenCalled();
    },
  );

  it("创建中账本已完成或不存在时返回不存在文案与 notFound", async () => {
    mocks.complete.mockRejectedValue(
      createSetupError(ledgerSetupErrorCodes.notFound),
    );

    const state = await completeLedgerSetup(completeInput);

    expect(state).toEqual({
      error: ledgerSetupErrorMessages[ledgerSetupErrorCodes.notFound],
      errorKey: expect.any(String),
      notFound: true,
    });
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it.each([
    ledgerSetupErrorCodes.templateOutdated,
    ledgerSetupErrorCodes.currencyMismatch,
  ])("%s 时重新读取进度并返回 outdated，不作为失败", async (code) => {
    mocks.complete.mockRejectedValue(createSetupError(code));

    const state = await completeLedgerSetup(completeInput);

    expect(state).toEqual({ outdated: true, progress });
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it("预设内容已更新但重新读取不到创建中账本时返回 notFound", async () => {
    mocks.complete.mockRejectedValue(
      createSetupError(ledgerSetupErrorCodes.templateOutdated),
    );
    mocks.getCurrentUserSetup.mockResolvedValue(null);

    const state = await completeLedgerSetup(completeInput);

    expect(state).toEqual({
      error: ledgerSetupErrorMessages[ledgerSetupErrorCodes.notFound],
      errorKey: expect.any(String),
      notFound: true,
    });
  });

  it.each([
    ledgerSetupErrorCodes.accountNameDuplicate,
    ledgerSetupErrorCodes.payloadInvalid,
    ledgerSetupErrorCodes.notInProgress,
  ])("完成写入被拒（%s）时返回对应安全文案", async (code) => {
    mocks.complete.mockRejectedValue(createSetupError(code));

    const state = await completeLedgerSetup(completeInput);

    expectErrorState(state, ledgerSetupErrorMessages[code]);
    expect(state).not.toHaveProperty("notFound");
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it("未知异常记录安全日志并返回完成失败的通用提示", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.complete.mockRejectedValue(new Error("database unavailable"));

    const state = await completeLedgerSetup(completeInput);

    expectErrorState(state, ledgerSetupWriteErrorMessages.completeFailed);
    expect(consoleError).toHaveBeenCalledWith(
      "[ledger] ledger setup complete action failed unexpectedly",
      { errorName: "Error" },
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "database unavailable",
    );
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("登录跳转保持原有 Next.js 控制流", async () => {
    mocks.getCurrentLedgerContext.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/login"),
    );

    await expect(completeLedgerSetup(completeInput)).rejects.toThrow(
      "NEXT_REDIRECT:/login",
    );
    expect(mocks.complete).not.toHaveBeenCalled();
  });
});

describe("loadLedgerSetupInviteMembers", () => {
  const userId = "00000000-0000-4000-8000-000000000031";
  const input = { ledgerId: ledgerSetupFixtureId };
  const pendingInvites = [
    {
      createdAt: "2026-10-07T01:00:00.000Z",
      id: "invite-1",
      placeholderId: "placeholder-1",
      role: "member" as const,
      token: "a".repeat(64),
    },
  ];
  const placeholderMembers = [
    {
      displayName: "奶奶",
      id: "placeholder-1",
    },
  ];

  it("成功时用账本设置页相同的 Service 读取待接受邀请与待邀请成员", async () => {
    mocks.listPendingInvites.mockResolvedValue(pendingInvites);
    mocks.listUnclaimedPlaceholders.mockResolvedValue(placeholderMembers);

    const state = await loadLedgerSetupInviteMembers(input);

    expect(state).toEqual({ members: { pendingInvites, placeholderMembers } });
    expect(mocks.listPendingInvites).toHaveBeenCalledWith({
      ledgerId: ledgerSetupFixtureId,
      userId,
    });
    expect(mocks.listUnclaimedPlaceholders).toHaveBeenCalledWith({
      ledgerId: ledgerSetupFixtureId,
      userId,
    });
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it.each([
    ["非 UUID", { ledgerId: "not-a-uuid" }],
    ["缺少账本 ID", {}],
  ])(
    "账本 ID 不合法（%s）时返回无法访问的文案，不调用 Service",
    async (_label, value) => {
      const state = await loadLedgerSetupInviteMembers(value as typeof input);

      expectErrorState(state, ledgerAccessErrorMessages.ledgerInaccessible);
      expect(mocks.listPendingInvites).not.toHaveBeenCalled();
      expect(mocks.listUnclaimedPlaceholders).not.toHaveBeenCalled();
    },
  );

  it("权限不足时返回 Service 的安全文案", async () => {
    const message =
      ledgerInviteErrorMessages[ledgerInviteErrorCodes.permissionDenied];
    mocks.listPendingInvites.mockRejectedValue(
      new AuthorizationError(ledgerInviteErrorCodes.permissionDenied, message),
    );
    mocks.listUnclaimedPlaceholders.mockResolvedValue([]);

    const state = await loadLedgerSetupInviteMembers(input);

    expectErrorState(state, message);
  });

  it("账本不存在或无法访问时返回 Service 的安全文案", async () => {
    mocks.listPendingInvites.mockResolvedValue([]);
    mocks.listUnclaimedPlaceholders.mockRejectedValue(
      new NotFoundError(
        "ledger_invalid",
        ledgerAccessErrorMessages.ledgerInaccessible,
      ),
    );

    const state = await loadLedgerSetupInviteMembers(input);

    expectErrorState(state, ledgerAccessErrorMessages.ledgerInaccessible);
  });

  it("未知异常记录安全日志并返回读取失败的通用提示", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.listPendingInvites.mockRejectedValue(
      new Error("database unavailable"),
    );
    mocks.listUnclaimedPlaceholders.mockResolvedValue([]);

    const state = await loadLedgerSetupInviteMembers(input);

    expectErrorState(
      state,
      ledgerSetupLoadErrorMessages.inviteMembersLoadFailed,
    );
    expect(consoleError).toHaveBeenCalledWith(
      "[ledger] ledger setup invite members action failed unexpectedly",
      { errorName: "Error" },
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "database unavailable",
    );
    consoleError.mockRestore();
  });

  it("登录跳转保持原有 Next.js 控制流", async () => {
    mocks.getCurrentLedgerContext.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/login"),
    );

    await expect(loadLedgerSetupInviteMembers(input)).rejects.toThrow(
      "NEXT_REDIRECT:/login",
    );
    expect(mocks.listPendingInvites).not.toHaveBeenCalled();
  });
});

describe("loadLedgerSetupWizardView", () => {
  const defaults = {
    baseCurrency: "JPY",
    displayColor: "amber" as const,
    displayName: "淞文",
    ledgerName: "家庭账本",
  };
  const defaultRootCategoryNames = ["💰 工资收入", "🍽️ 饮食"];

  beforeEach(() => {
    mocks.getCreateDefaults.mockResolvedValue({ defaults });
    mocks.listDefaultRootCategoryNames.mockResolvedValue(
      defaultRootCategoryNames,
    );
    mocks.getTemplate.mockReturnValue(progress.template);
  });

  it("返回打开向导所需的默认值、创建中账本进度与默认大分类", async () => {
    mocks.getCurrentUserSetup.mockResolvedValue(progress.setup);

    await expect(loadLedgerSetupWizardView()).resolves.toEqual({
      view: { defaultRootCategoryNames, defaults, progress },
    });
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it("没有创建中账本时进度为 null", async () => {
    mocks.getCurrentUserSetup.mockResolvedValue(null);

    await expect(loadLedgerSetupWizardView()).resolves.toEqual({
      view: { defaultRootCategoryNames, defaults, progress: null },
    });
  });

  it("应用错误时返回其安全文案", async () => {
    const error = createSetupError(ledgerSetupErrorCodes.notFound);
    mocks.getCurrentUserSetup.mockRejectedValue(error);

    expectErrorState(await loadLedgerSetupWizardView(), error.message);
  });

  it("未知异常记录安全日志并返回读取失败的通用提示", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.getCurrentUserSetup.mockRejectedValue(
      new Error("database unavailable"),
    );

    expectErrorState(
      await loadLedgerSetupWizardView(),
      ledgerSetupLoadErrorMessages.loadFailed,
    );
    expect(consoleError).toHaveBeenCalledWith(
      "[ledger] ledger setup wizard load action failed unexpectedly",
      { errorName: "Error" },
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "database unavailable",
    );
    consoleError.mockRestore();
  });

  it("登录跳转保持原有 Next.js 控制流", async () => {
    mocks.getCurrentLedgerContext.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/login"),
    );

    await expect(loadLedgerSetupWizardView()).rejects.toThrow(
      "NEXT_REDIRECT:/login",
    );
    expect(mocks.getCurrentUserSetup).not.toHaveBeenCalled();
  });
});
