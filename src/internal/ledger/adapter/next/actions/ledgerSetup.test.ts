// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ledgerCreateErrorCodes,
  ledgerCreateErrorMessages,
} from "internal/ledger/errors/ledgerCreate";
import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
  ledgerSetupWriteErrorMessages,
} from "internal/ledger/errors/ledgerSetup";
import {
  ConflictError,
  ValidationError,
} from "internal/shared/errors/appError";
import {
  createLedgerSetupProgressFixture,
  ledgerSetupFixtureId,
} from "test/mocks/ledgerSetup";
import type { LedgerSetupBasicInfoActionState } from "types/ledgers";

import { submitLedgerSetupBasicInfo } from "./ledgerSetup";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  createDependencies: vi.fn(),
  getCurrentLedgerContext: vi.fn(),
  getCurrentUserSetup: vi.fn(),
  getTemplate: vi.fn(),
  revalidateLedgerMutation: vi.fn(),
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
      setupService: {
        create: mocks.create,
        getCurrentUserSetup: mocks.getCurrentUserSetup,
        getTemplate: mocks.getTemplate,
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

function expectErrorState(
  state: LedgerSetupBasicInfoActionState,
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
