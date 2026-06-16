import { beforeEach, describe, expect, it, vi } from "vitest";

import { register, validateRegisterEmailFormat } from "server/actions/auth";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  signUp: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

function createRegisterFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();

  formData.set("displayName", "山田太郎");
  formData.set("email", "yamada@example.test");
  formData.set("password", "password-1234");
  formData.set("passwordConfirm", "password-1234");

  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }

  return formData;
}

describe("register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue({
      auth: {
        signUp: mocks.signUp,
      },
    });
    mocks.signUp.mockResolvedValue({ error: null });
  });

  it("必填项不足时返回错误", async () => {
    const result = await register({}, createRegisterFormData({ email: "" }));

    expect(result).toEqual({ error: "请输入昵称、邮箱和密码。" });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("密码确认不一致时返回错误", async () => {
    const result = await register(
      {},
      createRegisterFormData({ passwordConfirm: "different-password" }),
    );

    expect(result).toEqual({ error: "两次输入的密码不一致。" });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it.each([
    [
      "邮箱过长",
      { email: `${"a".repeat(250)}@example.test` },
      "邮箱最多 255 个字符。",
      false,
    ],
    ["邮箱格式有误", { email: "not-email" }, "邮箱格式有误", false],
    [
      "昵称过长",
      { displayName: "名".repeat(51) },
      "昵称最多 50 个字符。",
      false,
    ],
    [
      "密码过长",
      { password: "a1".repeat(37), passwordConfirm: "a1".repeat(37) },
      "密码最多 72 个字符。",
      true,
    ],
    [
      "确认密码过长",
      { passwordConfirm: "a1".repeat(37) },
      "确认密码最多 72 个字符。",
      false,
    ],
  ])(
    "字段长度或格式不符合规则时返回错误：%s",
    async (_, overrides, errorMessage, resetPassword) => {
      const result = await register({}, createRegisterFormData(overrides));

      expect(result).toEqual({
        error: errorMessage,
        ...(resetPassword ? { resetPassword } : {}),
      });
      expect(mocks.createClient).not.toHaveBeenCalled();
    },
  );

  it("密码不符合强度规则时返回错误并要求清空密码", async () => {
    const result = await register(
      {},
      createRegisterFormData({
        password: "password",
        passwordConfirm: "password",
      }),
    );

    expect(result).toEqual({
      error: "密码强度不足。密码至少 8 位，并且需要同时包含字母和数字。",
      resetPassword: true,
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("注册时将昵称写入 Supabase Auth metadata", async () => {
    const result = await register({}, createRegisterFormData());

    expect(mocks.signUp).toHaveBeenCalledWith({
      email: "yamada@example.test",
      password: "password-1234",
      options: {
        data: {
          display_name: "山田太郎",
        },
      },
    });
    expect(result).toEqual({
      success: "注册申请已提交。请查收确认邮件后再登录。",
    });
  });

  it.each([
    [
      "邮箱已存在",
      { code: "user_already_exists", message: "User already registered" },
      "这个邮箱已经注册过了，请直接登录或换一个邮箱。",
      false,
    ],
    [
      "邮箱格式不正确",
      { code: "invalid_email", message: "Email address is invalid" },
      "邮箱格式看起来不正确，请检查后再试。",
      false,
    ],
    [
      "密码强度不足",
      { code: "weak_password", message: "Password should be stronger" },
      "密码强度不足。密码至少 8 位，并且需要同时包含字母和数字。",
      true,
    ],
    [
      "注册功能关闭",
      { code: "signup_disabled", message: "Signups are disabled" },
      "当前暂时无法开放新用户注册，请稍后再试。",
      false,
    ],
    [
      "请求过于频繁",
      { code: "over_email_send_rate_limit", message: "Too many requests" },
      "注册请求太频繁了，请稍等一会儿再试。",
      false,
    ],
    [
      "未知错误",
      { message: "unexpected auth error" },
      "注册失败，请确认邮箱和密码后再试。",
      false,
    ],
    [
      "仅 message 提到 password 时不误判为弱密码",
      { message: "unexpected password provider error" },
      "注册失败，请确认邮箱和密码后再试。",
      false,
    ],
  ])(
    "Supabase 注册失败时返回细分错误：%s",
    async (_, error, errorMessage, resetPassword) => {
      mocks.signUp.mockResolvedValue({ error });

      const result = await register({}, createRegisterFormData());

      expect(result).toEqual({
        error: errorMessage,
        ...(resetPassword ? { resetPassword } : {}),
      });
    },
  );
});

describe("validateRegisterEmailFormat", () => {
  it.each([
    ["未输入邮箱", "", "请输入邮箱后再校验。"],
    ["邮箱过长", `${"a".repeat(250)}@example.test`, "邮箱最多 255 个字符。"],
    ["邮箱格式有误", "not-email", "邮箱格式有误"],
  ])("邮箱格式无法校验时返回错误：%s", async (_, email, errorMessage) => {
    const result = await validateRegisterEmailFormat(email);

    expect(result).toEqual({ error: errorMessage });
  });

  it("邮箱格式可用时返回可继续填写提示", async () => {
    const result = await validateRegisterEmailFormat("yamada@example.test");

    expect(result).toEqual({
      success: "该邮箱格式可以使用。",
    });
  });
});
