import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RegisterForm } from "./RegisterForm";

afterEach(() => {
  cleanup();
});

function createDefaultProps() {
  return {
    action: vi.fn(async () => ({})),
    validateEmailFormatAction: vi.fn(async () => ({
      success: "该邮箱格式可以使用。",
    })),
  };
}

describe("RegisterForm", () => {
  it("显示注册所需输入框", () => {
    render(<RegisterForm {...createDefaultProps()} />);

    expect(screen.getByLabelText(/昵称/)).toBeInTheDocument();
    expect(screen.getByLabelText(/邮箱/)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/密码/)[0]).toBeInTheDocument();
    expect(screen.getByLabelText(/确认密码/)).toBeInTheDocument();
  });

  it("显示注册按钮", () => {
    render(<RegisterForm {...createDefaultProps()} />);

    expect(screen.getByRole("button", { name: "注册" })).toBeInTheDocument();
  });

  it("邮箱输入框类型为 email", () => {
    render(<RegisterForm {...createDefaultProps()} />);

    expect(screen.getByLabelText(/邮箱/).getAttribute("type")).toBe("email");
  });

  it("密码输入框类型为 password", () => {
    render(<RegisterForm {...createDefaultProps()} />);

    expect(screen.getAllByLabelText(/密码/)[0].getAttribute("type")).toBe(
      "password",
    );
    expect(screen.getByLabelText(/确认密码/).getAttribute("type")).toBe(
      "password",
    );
  });

  it("邮箱显示在昵称之前", () => {
    render(<RegisterForm {...createDefaultProps()} />);

    const textboxes = screen.getAllByRole("textbox");

    expect(textboxes[0]).toHaveAccessibleName("邮箱");
    expect(textboxes[1]).toHaveAccessibleName("昵称");
  });

  it("用 placeholder 显示输入格式规则", () => {
    render(<RegisterForm {...createDefaultProps()} />);

    expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("输入昵称，最多 50 个字符"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("8-72 位，且包含字母和数字"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("再次输入相同密码")).toBeInTheDocument();
  });

  it("邮箱失去焦点时校验格式", async () => {
    render(<RegisterForm {...createDefaultProps()} />);

    const emailInput = screen.getByLabelText(/邮箱/);

    fireEvent.change(emailInput, { target: { value: "not-email" } });
    fireEvent.blur(emailInput);

    expect(await screen.findByText("邮箱格式有误")).toBeInTheDocument();
  });

  it("输入框失去焦点时校验长度", async () => {
    render(<RegisterForm {...createDefaultProps()} />);

    const emailInput = screen.getByLabelText(/邮箱/);
    const displayNameInput = screen.getByLabelText(/昵称/);
    const passwordInput = screen.getByLabelText(/^密码/);
    const passwordConfirmInput = screen.getByLabelText(/确认密码/);

    fireEvent.change(emailInput, {
      target: { value: `${"a".repeat(250)}@x.test` },
    });
    fireEvent.blur(emailInput);
    fireEvent.change(displayNameInput, { target: { value: "名".repeat(51) } });
    fireEvent.blur(displayNameInput);
    fireEvent.change(passwordInput, { target: { value: "a1".repeat(37) } });
    fireEvent.blur(passwordInput);
    fireEvent.change(passwordConfirmInput, {
      target: { value: "a1".repeat(37) },
    });
    fireEvent.blur(passwordConfirmInput);

    expect(
      await screen.findByText("邮箱最多 255 个字符。"),
    ).toBeInTheDocument();
    expect(await screen.findByText("昵称最多 50 个字符。")).toBeInTheDocument();
    expect(await screen.findByText("密码最多 72 个字符。")).toBeInTheDocument();
    expect(
      await screen.findByText("确认密码最多 72 个字符。"),
    ).toBeInTheDocument();
  });

  it("密码失去焦点时校验强度规则", async () => {
    render(<RegisterForm {...createDefaultProps()} />);

    const passwordInput = screen.getByLabelText(/^密码/);

    fireEvent.change(passwordInput, { target: { value: "password" } });
    fireEvent.blur(passwordInput);

    expect(
      await screen.findByText("密码至少 8 位，并且需要同时包含字母和数字。"),
    ).toBeInTheDocument();
  });

  it("确认密码失去焦点时校验两次密码一致", async () => {
    render(<RegisterForm {...createDefaultProps()} />);

    const passwordInput = screen.getByLabelText(/^密码/);
    const passwordConfirmInput = screen.getByLabelText(/确认密码/);

    fireEvent.change(passwordInput, { target: { value: "password-1234" } });
    fireEvent.change(passwordConfirmInput, {
      target: { value: "different-password" },
    });
    fireEvent.blur(passwordConfirmInput);

    expect(
      await screen.findByText("两次输入的密码不一致。"),
    ).toBeInTheDocument();
  });

  it("密码强度不足时只清空密码输入", async () => {
    const action = vi.fn(async () => ({
      error: "密码强度不足。密码至少 8 位，并且需要同时包含字母和数字。",
      resetPassword: true,
    }));
    render(<RegisterForm {...createDefaultProps()} action={action} />);

    const displayNameInput = screen.getByLabelText(/昵称/);
    const emailInput = screen.getByLabelText(/邮箱/);
    const passwordInput = screen.getByLabelText(/^密码/);
    const passwordConfirmInput = screen.getByLabelText(/确认密码/);
    const form = screen.getByRole("button", { name: "注册" }).closest("form");

    fireEvent.change(displayNameInput, { target: { value: "山田太郎" } });
    fireEvent.change(emailInput, { target: { value: "yamada@example.test" } });
    fireEvent.change(passwordInput, { target: { value: "password" } });
    fireEvent.change(passwordConfirmInput, { target: { value: "password" } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(passwordInput).toHaveValue("");
      expect(passwordConfirmInput).toHaveValue("");
    });
    expect(displayNameInput).toHaveValue("山田太郎");
    expect(emailInput).toHaveValue("yamada@example.test");
  });

  it("点击邮箱校验按钮后显示格式校验结果", async () => {
    const validateEmailFormatAction = vi.fn(async () => ({
      success: "该邮箱格式可以使用。",
    }));
    render(
      <RegisterForm
        {...createDefaultProps()}
        validateEmailFormatAction={validateEmailFormatAction}
      />,
    );

    const emailInput = screen.getByLabelText(/邮箱/);

    fireEvent.change(emailInput, { target: { value: "yamada@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "校验" }));

    expect(validateEmailFormatAction).toHaveBeenCalledWith(
      "yamada@example.test",
    );
    const successStatus = await screen.findByRole("status");

    expect(successStatus).toHaveTextContent("该邮箱格式可以使用。");
    expect(successStatus.querySelector("svg")).toBeInTheDocument();
  });

  it("输入框标签默认保持收缩，避免浏览器自动填充时重叠", () => {
    render(<RegisterForm {...createDefaultProps()} />);

    expect(screen.getByText("昵称").getAttribute("data-shrink")).toBe("true");
    expect(screen.getByText("邮箱").getAttribute("data-shrink")).toBe("true");
    expect(screen.getByText("密码").getAttribute("data-shrink")).toBe("true");
    expect(screen.getByText("确认密码").getAttribute("data-shrink")).toBe(
      "true",
    );
  });
});
