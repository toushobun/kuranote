import { cleanup, render, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { turnstileTestSiteKey } from "config/turnstile";

import { RegisterTemplate } from "./Register";

vi.mock("molecules/auth/GoogleAuthSection", () => ({
  GoogleAuthSection: ({
    action,
    errorMessage,
  }: {
    action?: unknown;
    errorMessage?: string;
  }): ReactNode => (
    <div
      data-testid="google-auth-section"
      data-has-action={String(Boolean(action))}
      data-error-message={errorMessage ?? ""}
    />
  ),
}));

vi.mock("organisms/auth/RegisterForm", () => ({
  RegisterForm: ({
    checkEmailAvailabilityAction,
    requestOtpAction,
    submitOtpAction,
    turnstileSiteKey,
  }: {
    checkEmailAvailabilityAction: unknown;
    requestOtpAction: unknown;
    submitOtpAction: unknown;
    turnstileSiteKey: string;
  }): ReactNode => (
    <form
      data-testid="register-form"
      data-has-email-check-action={String(
        Boolean(checkEmailAvailabilityAction),
      )}
      data-has-request-action={String(Boolean(requestOtpAction))}
      data-has-submit-action={String(Boolean(submitOtpAction))}
      data-turnstile-site-key={turnstileSiteKey}
    >
      <button type="submit">获取验证码</button>
    </form>
  ),
}));

afterEach(() => {
  cleanup();
});

const defaultProps = {
  checkEmailAvailabilityAction: vi.fn(async () => ({ available: true })),
  googleAction: vi.fn(async () => {}),
  requestOtpAction: vi.fn(async () => ({})),
  submitOtpAction: vi.fn(async () => ({})),
  turnstileSiteKey: turnstileTestSiteKey,
};

describe("RegisterTemplate", () => {
  it("显示应用名称标题", () => {
    const { container } = render(<RegisterTemplate {...defaultProps} />);

    expect(
      within(container).getByRole("heading", { name: "KuraNote" }),
    ).toBeTruthy();
  });

  it("渲染 Google 入口和注册表单", () => {
    const { container } = render(
      <RegisterTemplate
        {...defaultProps}
        googleErrorMessage="Google 登录未完成"
      />,
    );
    const googleSection = within(container).getByTestId("google-auth-section");
    const form = within(container).getByTestId("register-form");

    expect(googleSection.getAttribute("data-has-action")).toBe("true");
    expect(googleSection.getAttribute("data-error-message")).toBe(
      "Google 登录未完成",
    );
    expect(form.getAttribute("data-has-email-check-action")).toBe("true");
    expect(form.getAttribute("data-has-request-action")).toBe("true");
    expect(form.getAttribute("data-has-submit-action")).toBe("true");
    expect(form.getAttribute("data-turnstile-site-key")).toBe(
      turnstileTestSiteKey,
    );
  });

  it("未提供 Google action 时隐藏 Google 入口", () => {
    const { container } = render(
      <RegisterTemplate
        checkEmailAvailabilityAction={defaultProps.checkEmailAvailabilityAction}
        requestOtpAction={defaultProps.requestOtpAction}
        submitOtpAction={defaultProps.submitOtpAction}
        turnstileSiteKey={defaultProps.turnstileSiteKey}
      />,
    );

    expect(
      within(container).queryByTestId("google-auth-section"),
    ).not.toBeInTheDocument();
    expect(within(container).getByTestId("register-form")).toBeTruthy();
  });

  it("Google 入口关闭后仍传递授权错误", () => {
    const { container } = render(
      <RegisterTemplate
        checkEmailAvailabilityAction={defaultProps.checkEmailAvailabilityAction}
        googleErrorMessage="暂时无法连接 Google"
        requestOtpAction={defaultProps.requestOtpAction}
        submitOtpAction={defaultProps.submitOtpAction}
        turnstileSiteKey={defaultProps.turnstileSiteKey}
      />,
    );
    const googleSection = within(container).getByTestId("google-auth-section");

    expect(googleSection.getAttribute("data-has-action")).toBe("false");
    expect(googleSection.getAttribute("data-error-message")).toBe(
      "暂时无法连接 Google",
    );
  });

  it("显示返回登录页的链接", () => {
    const { container } = render(<RegisterTemplate {...defaultProps} />);

    expect(
      within(container).getByRole("link", { name: "登录" }),
    ).toHaveAttribute("href", "/login");
  });
});
