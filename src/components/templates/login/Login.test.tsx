import { cleanup, render, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginTemplate } from "./Login";

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

vi.mock("organisms/auth/LoginForm/LoginForm", () => ({
  LoginForm: ({
    action,
    defaultEmail,
  }: {
    action: unknown;
    defaultEmail?: string;
  }): ReactNode => (
    <form
      data-testid="login-form"
      data-default-email={defaultEmail ?? ""}
      onSubmit={(e) => {
        e.preventDefault();
        void (action as () => Promise<void>)();
      }}
    >
      <button type="submit">登录</button>
    </form>
  ),
}));

afterEach(() => {
  cleanup();
});

const defaultProps = {
  action: vi.fn(async () => ({})),
  googleAction: vi.fn(async () => {}),
};

describe("LoginTemplate", () => {
  it("显示应用名称标题", () => {
    const { container } = render(<LoginTemplate {...defaultProps} />);

    expect(
      within(container).getByRole("heading", { name: "KuraNote" }),
    ).toBeTruthy();
  });

  it("显示登录提示文字", () => {
    const { container } = render(<LoginTemplate {...defaultProps} />);

    expect(within(container).getByText("登录后开始使用记账功能")).toBeTruthy();
  });

  it("渲染 Google 入口和登录表单", () => {
    const { container } = render(
      <LoginTemplate
        {...defaultProps}
        defaultEmail="yamada@example.test"
        googleErrorMessage="Google 登录未完成"
      />,
    );

    expect(
      within(container)
        .getByTestId("google-auth-section")
        .getAttribute("data-has-action"),
    ).toBe("true");
    expect(
      within(container)
        .getByTestId("google-auth-section")
        .getAttribute("data-error-message"),
    ).toBe("Google 登录未完成");
    expect(
      within(container)
        .getByTestId("login-form")
        .getAttribute("data-default-email"),
    ).toBe("yamada@example.test");
  });

  it("未提供 Google action 时隐藏 Google 入口", () => {
    const { container } = render(
      <LoginTemplate action={vi.fn(async () => ({}))} />,
    );

    expect(
      within(container).queryByTestId("google-auth-section"),
    ).not.toBeInTheDocument();
    expect(within(container).getByTestId("login-form")).toBeTruthy();
  });

  it("Google 入口关闭后仍传递授权错误", () => {
    const { container } = render(
      <LoginTemplate
        action={vi.fn(async () => ({}))}
        googleErrorMessage="暂时无法连接 Google"
      />,
    );
    const googleSection = within(container).getByTestId("google-auth-section");

    expect(googleSection.getAttribute("data-has-action")).toBe("false");
    expect(googleSection.getAttribute("data-error-message")).toBe(
      "暂时无法连接 Google",
    );
  });

  it("显示前往注册页的链接", () => {
    const { container } = render(<LoginTemplate {...defaultProps} />);

    expect(
      within(container).getByRole("link", { name: "注册" }),
    ).toHaveAttribute("href", "/register");
  });
});
