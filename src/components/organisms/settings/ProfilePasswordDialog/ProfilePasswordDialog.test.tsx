import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserThemeProvider } from "theme/UserThemeProvider";
import {
  changePasswordFailureMessage,
  failedChangePasswordAction,
  passwordChangeOtpRateLimitedMessage,
  passwordChangeOtpSentMessage,
  rateLimitedPasswordChangeOtpAction,
  succeededChangePasswordAction,
  succeededPasswordChangeOtpAction,
} from "test/userProfileFixtures";

import { ProfilePasswordDialog } from "./ProfilePasswordDialog";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderDialog(
  props: Partial<Parameters<typeof ProfilePasswordDialog>[0]> = {},
) {
  const requestOtpAction = vi.fn(succeededPasswordChangeOtpAction);
  const changePasswordAction = vi.fn(succeededChangePasswordAction);
  const onClose = vi.fn();
  const view = render(
    <UserThemeProvider>
      <ProfilePasswordDialog
        changePasswordAction={changePasswordAction}
        email="user@example.com"
        onClose={onClose}
        open
        requestOtpAction={requestOtpAction}
        {...props}
      />
    </UserThemeProvider>,
  );
  return { changePasswordAction, onClose, requestOtpAction, view };
}

async function sendOtp() {
  fireEvent.click(screen.getByRole("button", { name: "发送验证码" }));
  await screen.findByText(passwordChangeOtpSentMessage);
}

function fillForm({
  password = "newpass123",
  passwordConfirm = "newpass123",
  token = "123456",
} = {}) {
  fireEvent.change(screen.getByLabelText("验证码"), {
    target: { value: token },
  });
  fireEvent.change(screen.getByLabelText("新密码"), {
    target: { value: password },
  });
  fireEvent.change(screen.getByLabelText("确认新密码"), {
    target: { value: passwordConfirm },
  });
}

describe("ProfilePasswordDialog", () => {
  it("说明会向登录邮箱发送验证码，发送前不显示密码输入框且不能保存", () => {
    renderDialog();

    expect(
      screen.getByText(/向登录邮箱「user@example\.com」发送 6 位验证码/),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("新密码")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
  });

  it("发送验证码成功后显示输入框，并在冷却期间禁止重复发送", async () => {
    const { requestOtpAction } = renderDialog();

    await sendOtp();

    expect(requestOtpAction).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("验证码")).toBeInTheDocument();
    expect(screen.getByLabelText("新密码")).toBeInTheDocument();
    expect(screen.getByLabelText("确认新密码")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "60 秒后可重新发送" }),
    ).toBeDisabled();
  });

  it("发送过于频繁时显示失败提示并进入冷却", async () => {
    renderDialog({ requestOtpAction: rateLimitedPasswordChangeOtpAction });

    fireEvent.click(screen.getByRole("button", { name: "发送验证码" }));

    expect(await screen.findByText("验证码发送失败")).toBeInTheDocument();
    expect(
      screen.getByText(passwordChangeOtpRateLimitedMessage),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "60 秒后可重新发送" }),
    ).toBeDisabled();
    expect(screen.queryByLabelText("新密码")).not.toBeInTheDocument();
  });

  it("提交验证码与新密码，成功后关闭弹框并显示成功提示", async () => {
    const { changePasswordAction, onClose } = renderDialog();

    await sendOtp();
    fillForm({ token: " 123456 " });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    const formData = changePasswordAction.mock.lastCall?.[1] as FormData;
    expect(Object.fromEntries(formData)).toEqual({
      password: "newpass123",
      passwordConfirm: "newpass123",
      token: "123456",
    });
    expect(await screen.findByText("密码已修改")).toBeInTheDocument();
  });

  it("保存失败时保留弹框并显示服务端返回的错误", async () => {
    const { onClose } = renderDialog({
      changePasswordAction: failedChangePasswordAction,
    });

    await sendOtp();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(await screen.findByText("密码修改失败")).toBeInTheDocument();
    expect(screen.getByText(changePasswordFailureMessage)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText("新密码")).toHaveValue("newpass123");
  });

  it("重新打开时清空输入，但保留已发送状态以便继续输入验证码", async () => {
    const { view } = renderDialog();

    await sendOtp();
    fillForm();

    const rerender = (open: boolean) =>
      act(() =>
        view.rerender(
          <UserThemeProvider>
            <ProfilePasswordDialog
              changePasswordAction={succeededChangePasswordAction}
              email="user@example.com"
              onClose={() => {}}
              open={open}
              requestOtpAction={succeededPasswordChangeOtpAction}
            />
          </UserThemeProvider>,
        ),
      );
    await rerender(false);
    await rerender(true);

    expect(await screen.findByLabelText("验证码")).toHaveValue("");
    expect(screen.getByLabelText("新密码")).toHaveValue("");
  });
});
