import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "./LoginForm";

afterEach(() => {
  cleanup();
});

const passwordFieldType = "password";

describe("LoginForm", () => {
  it("显示邮箱和密码输入框", () => {
    render(<LoginForm action={vi.fn(async () => ({}))} />);

    expect(screen.getByLabelText(/邮箱/)).toBeInTheDocument();
    expect(screen.getByLabelText(/密码/)).toBeInTheDocument();
  });

  it("显示登录按钮", () => {
    render(<LoginForm action={vi.fn(async () => ({}))} />);

    expect(screen.getByRole("button", { name: "登录" })).toBeInTheDocument();
  });

  it("邮箱输入框类型为 email", () => {
    render(<LoginForm action={vi.fn(async () => ({}))} />);

    expect(screen.getByLabelText(/邮箱/).getAttribute("type")).toBe("email");
  });

  it("密码输入框类型正确", () => {
    render(<LoginForm action={vi.fn(async () => ({}))} />);

    expect(screen.getByLabelText(/密码/).getAttribute("type")).toBe(
      passwordFieldType,
    );
  });

  it("支持预填邮箱", () => {
    render(
      <LoginForm
        action={vi.fn(async () => ({}))}
        initialEmail="yamada@example.test"
      />,
    );

    expect(screen.getByLabelText(/邮箱/)).toHaveValue("yamada@example.test");
  });

  it("输入框标签默认保持收缩，避免浏览器自动填充时重叠", () => {
    render(<LoginForm action={vi.fn(async () => ({}))} />);

    expect(screen.getByText("邮箱").getAttribute("data-shrink")).toBe("true");
    expect(screen.getByText("密码").getAttribute("data-shrink")).toBe("true");
  });
});
