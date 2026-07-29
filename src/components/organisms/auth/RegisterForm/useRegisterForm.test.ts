import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRegisterForm } from "./useRegisterForm";

const mocks = vi.hoisted(() => ({ routerPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));

function renderRegisterFormHook(
  checkEmailAvailabilityAction = vi.fn(async () => ({ available: true })),
) {
  const requestOtpAction = vi.fn(async () => ({}));
  const submitOtpAction = vi.fn(async () => ({}));

  return {
    ...renderHook(() =>
      useRegisterForm({
        checkEmailAvailabilityAction,
        requestOtpAction,
        submitOtpAction,
        turnstileSiteKey: "",
      }),
    ),
    checkEmailAvailabilityAction,
    requestOtpAction,
    submitOtpAction,
  };
}

describe("useRegisterForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("邮箱格式无效时显示本地错误且不请求可用性检查", async () => {
    const { checkEmailAvailabilityAction, result } = renderRegisterFormHook();

    act(() => result.current.handleEmailChange("invalid-email"));
    await act(async () => result.current.handleEmailBlur());

    expect(result.current.emailError).toBe("邮箱格式有误");
    expect(checkEmailAvailabilityAction).not.toHaveBeenCalled();
    expect(result.current.emailAvailabilityChecked).toBe(false);
  });

  it("邮箱已存在时记录检查结果和对应错误", async () => {
    const checkEmailAvailabilityAction = vi.fn(async () => ({
      available: false,
      error: "该邮箱已被注册。",
      reason: "email_exists" as const,
    }));
    const { result } = renderRegisterFormHook(checkEmailAvailabilityAction);

    act(() => result.current.handleEmailChange("user@example.com"));
    await act(async () => result.current.handleEmailBlur());

    await waitFor(() =>
      expect(result.current.emailAvailabilityChecked).toBe(true),
    );
    expect(checkEmailAvailabilityAction).toHaveBeenCalledWith(
      "user@example.com",
    );
    expect(result.current.emailAvailabilityError).toBe("该邮箱已被注册。");
    expect(result.current.isEmailExists).toBe(true);
    expect(result.current.isEmailAvailabilityPending).toBe(false);
  });

  it("可用性检查抛出异常时显示安全提示", async () => {
    const checkEmailAvailabilityAction = vi.fn(async () => {
      throw new Error("network error");
    });
    const { result } = renderRegisterFormHook(checkEmailAvailabilityAction);

    act(() => result.current.handleEmailChange("user@example.com"));
    await act(async () => result.current.handleEmailBlur());

    await waitFor(() =>
      expect(result.current.emailAvailabilityChecked).toBe(true),
    );
    expect(result.current.emailAvailabilityError).not.toBe("");
    expect(result.current.isEmailAvailabilityPending).toBe(false);
  });

  it("验证码输入只保留前六位数字并在失焦后校验", () => {
    const { result } = renderRegisterFormHook();

    act(() => result.current.handleOtpCodeChange("1a2b345678"));
    expect(result.current.otpCode).toBe("123456");
    expect(result.current.canSubmitOtp).toBe(true);

    act(() => {
      result.current.handleOtpCodeChange("123");
      result.current.handleOtpCodeBlur();
    });
    expect(result.current.otpCodeError).toBe("请输入 6 位数字验证码");
    expect(result.current.canSubmitOtp).toBe(false);
  });
});
