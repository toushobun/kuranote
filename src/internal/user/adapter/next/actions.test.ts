// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError, ConflictError } from "internal/shared/errors/appError";

import { updateDisplayName, updateTransactionColorScheme } from "./actions";

const mocks = vi.hoisted(() => ({
  createDependencies: vi.fn(),
  revalidate: vi.fn(),
  revalidateUserProfile: vi.fn(),
  updateCurrentDisplayName: vi.fn(),
  updateCurrentProfile: vi.fn(),
}));

vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createDependencies,
}));

vi.mock("internal/container", () => ({
  createRequestContainer: () => ({
    user: {
      service: {
        updateCurrentDisplayName: mocks.updateCurrentDisplayName,
        updateCurrentProfile: mocks.updateCurrentProfile,
      },
    },
  }),
}));

vi.mock("internal/user/adapter/next/revalidate", () => ({
  revalidateTransactionColorSchemeMutation: mocks.revalidate,
  revalidateUserProfileMutation: mocks.revalidateUserProfile,
}));

function createFormData(value = "expense_red_income_green") {
  const formData = new FormData();
  formData.set("transactionColorScheme", value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createDependencies.mockResolvedValue({});
  mocks.updateCurrentProfile.mockResolvedValue({
    transactionColorScheme: "expense_red_income_green",
  });
});

describe("updateTransactionColorScheme", () => {
  it("保存成功后失效设置页并返回新偏好", async () => {
    await expect(
      updateTransactionColorScheme({}, createFormData()),
    ).resolves.toEqual({
      success: "收支配色方案已保存。",
      transactionColorScheme: "expense_red_income_green",
    });
    expect(mocks.updateCurrentProfile).toHaveBeenCalledWith({
      transactionColorScheme: "expense_red_income_green",
    });
    expect(mocks.revalidate).toHaveBeenCalledOnce();
  });

  it("非法表单返回源头校验文案且不初始化依赖", async () => {
    await expect(
      updateTransactionColorScheme({}, createFormData("invalid")),
    ).resolves.toEqual({
      error: "请选择有效的收支配色方案。",
      errorKey: expect.any(String),
    });
    expect(mocks.createDependencies).not.toHaveBeenCalled();
    expect(mocks.updateCurrentProfile).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("Service 应用错误直接返回安全文案", async () => {
    mocks.updateCurrentProfile.mockRejectedValue(
      new AppError("user_inactive", "当前用户已停用。"),
    );

    await expect(
      updateTransactionColorScheme({}, createFormData()),
    ).resolves.toEqual({
      error: "当前用户已停用。",
      errorKey: expect.any(String),
    });
  });

  it("未知异常记录安全字段并返回通用提示", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.updateCurrentProfile.mockRejectedValue(new Error("database failed"));

    await expect(
      updateTransactionColorScheme({}, createFormData()),
    ).resolves.toEqual({
      error: "收支配色方案保存失败，请稍后重试。",
      errorKey: expect.any(String),
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[user] transaction color scheme action failed unexpectedly",
      { errorName: "Error" },
    );
    consoleError.mockRestore();
  });
});

const ledgerId = "00000000-0000-4000-8000-000000000101";

function createDisplayNameFormData(
  displayName = " 新昵称 ",
  syncLedgerIds: string[] = [ledgerId],
) {
  const formData = new FormData();
  formData.set("displayName", displayName);
  syncLedgerIds.forEach((id) => formData.append("syncLedgerIds", id));
  return formData;
}

describe("updateDisplayName", () => {
  beforeEach(() => {
    mocks.updateCurrentDisplayName.mockResolvedValue(undefined);
  });

  it("保存成功后失效用户资料相关页面", async () => {
    await expect(
      updateDisplayName({}, createDisplayNameFormData()),
    ).resolves.toEqual({
      success: "昵称已保存。",
      successKey: expect.any(String),
    });
    expect(mocks.updateCurrentDisplayName).toHaveBeenCalledWith({
      displayName: "新昵称",
      syncLedgerIds: [ledgerId],
    });
    expect(mocks.revalidateUserProfile).toHaveBeenCalledOnce();
  });

  it("非法表单返回源头校验文案且不调用 Service", async () => {
    await expect(
      updateDisplayName({}, createDisplayNameFormData("   ")),
    ).resolves.toEqual({
      error: "请输入昵称。",
      errorKey: expect.any(String),
    });
    expect(mocks.createDependencies).not.toHaveBeenCalled();
    expect(mocks.updateCurrentDisplayName).not.toHaveBeenCalled();
    expect(mocks.revalidateUserProfile).not.toHaveBeenCalled();
  });

  it("账本昵称冲突时返回 Service 的安全文案且不失效页面", async () => {
    mocks.updateCurrentDisplayName.mockRejectedValue(
      new ConflictError(
        "display_name_ledger_conflict",
        "以下账本无法使用该昵称，昵称未修改。",
      ),
    );

    await expect(
      updateDisplayName({}, createDisplayNameFormData()),
    ).resolves.toEqual({
      error: "以下账本无法使用该昵称，昵称未修改。",
      errorKey: expect.any(String),
    });
    expect(mocks.revalidateUserProfile).not.toHaveBeenCalled();
  });

  it("未知异常记录安全字段并返回通用提示", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.updateCurrentDisplayName.mockRejectedValue(new Error("db failed"));

    await expect(
      updateDisplayName({}, createDisplayNameFormData()),
    ).resolves.toEqual({
      error: "昵称保存失败，请稍后重试。",
      errorKey: expect.any(String),
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[user] display name action failed unexpectedly",
      { errorName: "Error" },
    );
    consoleError.mockRestore();
  });
});
