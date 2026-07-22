import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { turnstileTestSiteKey } from "config/turnstile";
import type { RegisterEmailAvailabilityState } from "types/auth";

import { RegisterForm } from "./RegisterForm";
import {
  turnstileScriptId,
  type TurnstileApi,
  type TurnstileRenderOptions,
} from "./turnstile";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  document.getElementById(turnstileScriptId)?.remove();
  delete window.turnstile;
  vi.restoreAllMocks();
});

function createDefaultProps() {
  return {
    checkEmailAvailabilityAction: vi.fn(
      async (): Promise<RegisterEmailAvailabilityState> => ({
        available: true,
      }),
    ),
    requestOtpAction: vi.fn(async () => ({})),
    submitOtpAction: vi.fn(async () => ({})),
    turnstileSiteKey: turnstileTestSiteKey,
  };
}

function enterRegisterFields() {
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
}

function expectRegisterFieldsPreserved() {
  expect(screen.getByLabelText(/邮箱/)).toHaveValue("yamada@example.test");
  expect(screen.getByLabelText(/昵称/)).toHaveValue("山田太郎");
  expect(screen.getByLabelText(/^密码/)).toHaveValue("password123");
  expect(screen.getByLabelText(/确认密码/)).toHaveValue("password123");
}

function installInteractiveTurnstile() {
  let renderOptions: TurnstileRenderOptions | undefined;
  const reset = vi.fn(() => {
    renderOptions?.callback("turnstile-retry-ok");
  });
  const api: TurnstileApi = {
    render: (_container, options) => {
      renderOptions = options;
      options.callback("turnstile-ok");
      return "turnstile-widget";
    },
    remove: vi.fn(),
    reset,
  };
  window.turnstile = api;

  return {
    getRenderOptions: () => renderOptions,
    reset,
  };
}

describe("RegisterForm Turnstile", () => {
  it("Turnstile 过期后可重试且不丢失注册信息", async () => {
    const turnstile = installInteractiveTurnstile();
    const props = createDefaultProps();
    props.requestOtpAction.mockResolvedValue({
      retryAfterSeconds: 0,
      status: "success",
    });
    render(<RegisterForm {...props} />);

    enterRegisterFields();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "获取验证码" })).toBeEnabled();
      expect(turnstile.getRenderOptions()).toBeDefined();
    });

    act(() => {
      turnstile.getRenderOptions()?.["expired-callback"]?.();
    });

    expect(
      await screen.findByText("人机验证失败，请刷新页面后再试。"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "重新加载验证" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "获取验证码" })).toBeDisabled();
    expectRegisterFieldsPreserved();

    fireEvent.click(screen.getByRole("button", { name: "重新加载验证" }));

    expect(turnstile.reset).toHaveBeenCalledWith("turnstile-widget");
    await waitFor(() => {
      expect(
        screen.queryByText("人机验证失败，请刷新页面后再试。"),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "获取验证码" })).toBeEnabled();
    });
    expectRegisterFieldsPreserved();

    fireEvent.click(screen.getByRole("button", { name: "获取验证码" }));

    expect(await screen.findByLabelText(/验证码/)).toBeInTheDocument();
    expect(props.requestOtpAction).toHaveBeenCalledTimes(1);
  });

  it("Turnstile 脚本加载失败后可重试且保留注册信息", async () => {
    delete window.turnstile;
    render(<RegisterForm {...createDefaultProps()} />);

    enterRegisterFields();
    const script = await waitFor(() => {
      const element = document.getElementById(turnstileScriptId);
      expect(element).toBeInstanceOf(HTMLScriptElement);
      return element as HTMLScriptElement;
    });

    fireEvent.error(script);

    expect(
      await screen.findByText("人机验证加载失败，请检查网络后刷新页面重试。"),
    ).toBeInTheDocument();
    expectRegisterFieldsPreserved();

    fireEvent.click(screen.getByRole("button", { name: "重新加载验证" }));

    await waitFor(() => {
      expect(document.getElementById(turnstileScriptId)).toBeInstanceOf(
        HTMLScriptElement,
      );
    });
    expectRegisterFieldsPreserved();
  });

  it("Turnstile 脚本加载超时后可重试且保留注册信息", () => {
    vi.useFakeTimers();

    try {
      delete window.turnstile;
      render(<RegisterForm {...createDefaultProps()} />);

      enterRegisterFields();
      const initialScript = document.getElementById(turnstileScriptId);
      expect(initialScript).toBeInstanceOf(HTMLScriptElement);

      act(() => {
        vi.advanceTimersByTime(10_000);
      });

      expect(
        screen.getByText("人机验证加载超时，请检查网络后刷新页面重试。"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "重新加载验证" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "获取验证码" })).toBeDisabled();
      expectRegisterFieldsPreserved();

      fireEvent.click(screen.getByRole("button", { name: "重新加载验证" }));

      const retriedScript = document.getElementById(turnstileScriptId);
      expect(retriedScript).toBeInstanceOf(HTMLScriptElement);
      expect(retriedScript).not.toBe(initialScript);
      expectRegisterFieldsPreserved();
    } finally {
      vi.useRealTimers();
    }
  });

  it("服务端验证失败会显示产品内提示并允许重新提交", async () => {
    installInteractiveTurnstile();
    const props = createDefaultProps();
    props.requestOtpAction
      .mockResolvedValueOnce({
        error: "人机验证失败，请稍后重试",
        resetTurnstile: true,
        status: "turnstile_failed",
      })
      .mockResolvedValueOnce({
        retryAfterSeconds: 0,
        status: "success",
      });
    render(<RegisterForm {...props} />);

    enterRegisterFields();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "获取验证码" })).toBeEnabled();
    });
    fireEvent.click(screen.getByRole("button", { name: "获取验证码" }));

    expect(
      await screen.findByText("人机验证失败，请稍后重试"),
    ).toBeInTheDocument();
    expectRegisterFieldsPreserved();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "获取验证码" })).toBeEnabled();
    });
    fireEvent.click(screen.getByRole("button", { name: "获取验证码" }));

    expect(await screen.findByLabelText(/验证码/)).toBeInTheDocument();
    expect(props.requestOtpAction).toHaveBeenCalledTimes(2);
  });
});
