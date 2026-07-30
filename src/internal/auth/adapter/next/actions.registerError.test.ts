// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { requestRegisterOtp } from "internal/auth/adapter/next/actions";
import {
  registerErrorMessages,
  registerOtpMessages,
} from "internal/auth/errors";
import {
  AuthorizationError,
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";
import { TurnstileConfigurationError } from "internal/auth/turnstileKeys";

const mocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  headers: vi.fn(),
  redirect: vi.fn(),
  requestRegisterOtp: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));
vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));

function createRegisterFormData() {
  const formData = new FormData();
  formData.set("displayName", "山田太郎");
  formData.set("email", "user@example.test");
  formData.set("password", "password-1234");
  formData.set("passwordConfirm", "password-1234");
  formData.set("turnstileToken", "turnstile-token");
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.headers.mockResolvedValue(
    new Headers({
      origin: "https://kuranote.test",
      "x-real-ip": "203.0.113.10",
    }),
  );
  mocks.createServerRequestDependencies.mockResolvedValue({});
  mocks.createRequestContainer.mockReturnValue({
    auth: { service: { requestRegisterOtp: mocks.requestRegisterOtp } },
  });
});

describe("requestRegisterOtp 注册失败文案", () => {
  it("注册关闭和注册兜底失败时保留 Service 的安全文案", async () => {
    mocks.requestRegisterOtp.mockRejectedValueOnce(
      new AuthorizationError(
        "signup_disabled",
        registerErrorMessages.signupDisabled,
      ),
    );

    await expect(
      requestRegisterOtp({}, createRegisterFormData()),
    ).resolves.toEqual({
      error: registerErrorMessages.signupDisabled,
      resetTurnstile: true,
      status: "unknown_error",
    });

    mocks.requestRegisterOtp.mockRejectedValueOnce(
      new ValidationError("register_failed", registerErrorMessages.fallback),
    );

    await expect(
      requestRegisterOtp({}, createRegisterFormData()),
    ).resolves.toEqual({
      error: registerErrorMessages.fallback,
      resetTurnstile: true,
      status: "unknown_error",
    });
  });

  it("未列入白名单的应用错误继续返回通用安全文案", async () => {
    mocks.requestRegisterOtp.mockRejectedValue(
      new RepositoryError("unexpected_auth_error", "不应透出的内部文案"),
    );

    await expect(
      requestRegisterOtp({}, createRegisterFormData()),
    ).resolves.toEqual({
      error: registerOtpMessages.serviceError,
      resetTurnstile: true,
      status: "unknown_error",
    });
  });

  it("Turnstile 配置错误只返回通用文案且日志不泄露配置细节", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.requestRegisterOtp.mockRejectedValue(
      new TurnstileConfigurationError(),
    );

    await expect(
      requestRegisterOtp({}, createRegisterFormData()),
    ).resolves.toEqual({
      error: registerOtpMessages.serviceError,
      resetTurnstile: true,
      status: "unknown_error",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[auth] OTP request action failed unexpectedly",
      { errorName: "TurnstileConfigurationError" },
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "TURNSTILE_SECRET_KEY",
    );

    consoleError.mockRestore();
  });
});
