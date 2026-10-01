import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import {
  googleIdentityAlreadyExistsMessage,
  googleIdentityStartFailedMessage,
  googleIdentityUnlinkFailedMessage,
  googleOnlyIdentity,
  googleOnlyLoginIdentityMessage,
  unlinkableGoogleIdentity,
  unlinkedGoogleIdentity,
} from "test/userProfileFixtures";

import { ProfileAccountLinking } from "./ProfileAccountLinking";

const routerReplaceMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/");
});

type Props = ComponentProps<typeof ProfileAccountLinking>;

function renderAccountLinking(overrides: Partial<Props> = {}) {
  const props: Props = {
    googleIdentity: unlinkedGoogleIdentity,
    isLast: true,
    linkAction: vi.fn(async () => ({})),
    linkFeedback: null,
    unlinkAction: vi.fn(async () => ({})),
    ...overrides,
  };

  render(
    <ConfirmDialogTestProviders>
      <ProfileAccountLinking {...props} />
    </ConfirmDialogTestProviders>,
  );

  return props;
}

/** 渲染后展开「账号绑定」区域。 */
function renderExpandedAccountLinking(overrides: Partial<Props> = {}) {
  const props = renderAccountLinking(overrides);
  fireEvent.click(screen.getByRole("button", { name: /账号绑定/ }));
  return props;
}

describe("ProfileAccountLinking", () => {
  it("默认收起，展开后显示 Google 未绑定和绑定按钮", () => {
    renderAccountLinking();

    expect(screen.queryByText("Google")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /账号绑定/ }));

    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByText("未绑定")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "绑定" })).toBeEnabled();
  });

  it("点击绑定调用绑定 Action", async () => {
    const { linkAction } = renderExpandedAccountLinking();

    fireEvent.click(screen.getByRole("button", { name: "绑定" }));

    await waitFor(() => expect(linkAction).toHaveBeenCalledTimes(1));
  });

  it("开始绑定失败时显示失败反馈", async () => {
    renderExpandedAccountLinking({
      linkAction: async () => ({
        error: googleIdentityStartFailedMessage,
        errorKey: "error-1",
      }),
    });

    fireEvent.click(screen.getByRole("button", { name: "绑定" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Google 账号绑定失败");
    expect(alert).toHaveTextContent(googleIdentityStartFailedMessage);
  });

  it("已绑定时显示绑定的 Google 邮箱和可用的解除绑定按钮", () => {
    renderExpandedAccountLinking({ googleIdentity: unlinkableGoogleIdentity });

    expect(
      screen.getByText("已绑定（user.google@gmail.com）"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "解除绑定" })).toBeEnabled();
  });

  it("Google 是唯一登录身份时禁用解除绑定并显示原因", () => {
    renderExpandedAccountLinking({ googleIdentity: googleOnlyIdentity });

    expect(screen.getByRole("button", { name: "解除绑定" })).toBeDisabled();
    expect(
      screen.getByText(googleOnlyLoginIdentityMessage),
    ).toBeInTheDocument();
  });

  it("解除绑定需二次确认，取消时不调用 Action", async () => {
    const { unlinkAction } = renderExpandedAccountLinking({
      googleIdentity: unlinkableGoogleIdentity,
    });

    fireEvent.click(screen.getByRole("button", { name: "解除绑定" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("解除 Google 绑定？");
    expect(dialog).toHaveTextContent("「user.google@gmail.com」");

    fireEvent.click(within(dialog).getByRole("button", { name: "取消" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(unlinkAction).not.toHaveBeenCalled();
  });

  it("确认解除绑定后调用 Action 并显示成功反馈", async () => {
    const { unlinkAction } = renderExpandedAccountLinking({
      googleIdentity: unlinkableGoogleIdentity,
      unlinkAction: vi.fn(async () => ({
        success: "已解除 Google 绑定。",
        successKey: "success-1",
      })),
    });

    fireEvent.click(screen.getByRole("button", { name: "解除绑定" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "解除绑定" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "已解除 Google 绑定",
    );
    expect(unlinkAction).toHaveBeenCalledTimes(1);
  });

  it("解除绑定失败时显示失败反馈", async () => {
    renderExpandedAccountLinking({
      googleIdentity: unlinkableGoogleIdentity,
      unlinkAction: async () => ({
        error: googleIdentityUnlinkFailedMessage,
        errorKey: "error-1",
      }),
    });

    fireEvent.click(screen.getByRole("button", { name: "解除绑定" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "解除绑定" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("解除绑定失败");
    expect(alert).toHaveTextContent(googleIdentityUnlinkFailedMessage);
  });

  it("从 Google 授权回跳成功时展开区域并显示成功反馈", () => {
    renderAccountLinking({
      googleIdentity: unlinkableGoogleIdentity,
      linkFeedback: { kind: "success" },
    });

    expect(screen.getByRole("status")).toHaveTextContent("Google 账号已绑定");
    expect(
      screen.getByText("已绑定（user.google@gmail.com）"),
    ).toBeInTheDocument();
  });

  it("回跳失败反馈关闭后从 URL 移除 linkResult", async () => {
    window.history.replaceState(
      null,
      "",
      "/settings/profile?linkResult=identity_already_exists",
    );
    renderAccountLinking({
      linkFeedback: {
        kind: "failure",
        message: googleIdentityAlreadyExistsMessage,
      },
    });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(googleIdentityAlreadyExistsMessage);

    fireEvent.click(within(alert).getByRole("button", { name: "关闭" }));

    expect(routerReplaceMock).toHaveBeenCalledWith("/settings/profile", {
      scroll: false,
    });
  });
});
