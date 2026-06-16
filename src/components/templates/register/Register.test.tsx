import { cleanup, render, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RegisterTemplate } from "./Register";

vi.mock("organisms/auth/RegisterForm", () => ({
  RegisterForm: ({
    action,
    validateEmailFormatAction,
  }: {
    action: unknown;
    validateEmailFormatAction: unknown;
  }): ReactNode => (
    <form
      data-testid="register-form"
      data-has-email-format-validation={String(
        Boolean(validateEmailFormatAction),
      )}
      onSubmit={(e) => {
        e.preventDefault();
        void (action as () => Promise<void>)();
      }}
    >
      <button type="submit">注册</button>
    </form>
  ),
}));

afterEach(() => {
  cleanup();
});

const defaultProps = {
  action: vi.fn(async () => ({})),
  validateEmailFormatAction: vi.fn(async () => ({})),
};

describe("RegisterTemplate", () => {
  it("显示应用名称标题", () => {
    const { container } = render(<RegisterTemplate {...defaultProps} />);

    expect(
      within(container).getByRole("heading", { name: "UchiLog" }),
    ).toBeTruthy();
  });

  it("显示注册提示文字", () => {
    const { container } = render(<RegisterTemplate {...defaultProps} />);

    expect(
      within(container).getByText("创建账号后开始使用记账功能"),
    ).toBeTruthy();
  });

  it("渲染注册表单", () => {
    const { container } = render(<RegisterTemplate {...defaultProps} />);

    expect(within(container).getByTestId("register-form")).toBeTruthy();
    expect(
      within(container)
        .getByTestId("register-form")
        .getAttribute("data-has-email-format-validation"),
    ).toBe("true");
  });

  it("显示返回登录页的链接", () => {
    const { container } = render(<RegisterTemplate {...defaultProps} />);

    expect(
      within(container).getByRole("link", { name: "登录" }),
    ).toHaveAttribute("href", "/login");
  });
});
