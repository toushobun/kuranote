// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "internal/shared/errors/appError";

import { updateTransactionColorScheme } from "./actions";

const mocks = vi.hoisted(() => ({
  createDependencies: vi.fn(),
  revalidate: vi.fn(),
  updateCurrentProfile: vi.fn(),
}));

vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createDependencies,
}));

vi.mock("internal/container", () => ({
  createRequestContainer: () => ({
    user: {
      service: { updateCurrentProfile: mocks.updateCurrentProfile },
    },
  }),
}));

vi.mock("internal/user/adapter/next/revalidate", () => ({
  revalidateUserProfileMutation: mocks.revalidate,
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
  it("保存成功后刷新页面并返回新偏好", async () => {
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
    expect(mocks.revalidate).not.toHaveBeenCalled();
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
    expect(mocks.revalidate).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
