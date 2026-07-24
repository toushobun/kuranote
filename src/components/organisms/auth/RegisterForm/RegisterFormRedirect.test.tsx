import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { turnstileTestSiteKey } from "config/turnstile";
import type { RegisterEmailAvailabilityState } from "types/auth";

import { installMockTurnstile } from "test/turnstile/mockTurnstile";
import { RegisterForm } from "./RegisterForm";

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.routerPush,
  }),
}));

beforeEach(() => {
  mocks.routerPush.mockClear();
  installMockTurnstile();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function createProps(redirectTo: string) {
  return {
    checkEmailAvailabilityAction: vi.fn(
      async (): Promise<RegisterEmailAvailabilityState> => ({
        available: true,
      }),
    ),
    requestOtpAction: vi.fn(async () => ({ status: "success" as const })),
    submitOtpAction: vi.fn(async () => ({
      redirectTo,
      status: "success" as const,
      success: "注册完成。",
    })),
    turnstileSiteKey: turnstileTestSiteKey,
  };
}

async function completeRegistration(redirectTo: string) {
  const props = createProps(redirectTo);
  render(<RegisterForm {...props} />);

  fireEvent.change(screen.getByLabelText(/邮箱/), {
    target: { value: "yamada@example.test" },
  });
  fireEvent.change(screen.getByLabelText(/昵称/), {
    target: { value: "山田太郎" },
  });
  fireEvent.change(screen.getByLabelText(/^密码/), {
    target: { value: "password123" },
  });
  fireEvent.change(screen.getByLabelText(/确认密码/), {
    target: { value: "password123" },
  });

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "获取验证码" })).toBeEnabled();
  });
  fireEvent.click(screen.getByRole("button", { name: "获取验证码" }));
  fireEvent.change(await screen.findByLabelText(/验证码/), {
    target: { value: "012345" },
  });
  fireEvent.click(screen.getByRole("button", { name: "完成注册" }));

  await screen.findByText("注册完成，正在跳转...");
}

describe("RegisterForm 安全跳转", () => {
  it("注册成功后允许跳转到站内路径", async () => {
    await completeRegistration("/invite/invite-token");

    await waitFor(() => {
      expect(mocks.routerPush).toHaveBeenCalledWith("/invite/invite-token");
    });
  });

  it.each([
    ["https://evil.example", "外部 URL"],
    ["//evil.example", "双斜杠路径"],
    ["/invite\\evil", "反斜杠路径"],
    ["/\nevil.example", "原始控制字符"],
    ["/%0A/evil.example", "百分号编码控制字符"],
  ])("拒绝%s：%s", async (redirectTo) => {
    await completeRegistration(redirectTo);

    expect(mocks.routerPush).not.toHaveBeenCalled();
  });
});
