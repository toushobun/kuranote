import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserThemeProvider } from "theme/UserThemeProvider";

import {
  AccountDialogIllustrationSlot,
  AccountFormDialogShell,
} from "./AccountFormDialogShell";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-user-theme");
});

function renderWithUserTheme(children: ReactNode) {
  return render(
    <UserThemeProvider storageScope="account-form-dialog-shell-test">
      {children}
    </UserThemeProvider>,
  );
}

describe("AccountFormDialogShell", () => {
  it("打开时显示内容", () => {
    render(
      <AccountFormDialogShell onClose={vi.fn()} open>
        <p>弹窗内容</p>
      </AccountFormDialogShell>,
    );

    expect(screen.getByText("弹窗内容")).toBeInTheDocument();
  });

  it("关闭时不显示内容", () => {
    render(
      <AccountFormDialogShell onClose={vi.fn()} open={false}>
        <p>弹窗内容</p>
      </AccountFormDialogShell>,
    );

    expect(screen.queryByText("弹窗内容")).toBeNull();
  });

  it("使用贴底的弹窗布局", () => {
    render(
      <AccountFormDialogShell onClose={vi.fn()} open>
        <p>弹窗内容</p>
      </AccountFormDialogShell>,
    );

    const dialogContainer = document.querySelector(".MuiDialog-container");
    const dialogPaper = document.querySelector(".MuiDialog-paper");

    if (!(dialogContainer instanceof HTMLElement)) {
      throw new Error("账户表单弹窗容器未渲染。");
    }

    if (!(dialogPaper instanceof HTMLElement)) {
      throw new Error("账户表单弹窗面板未渲染。");
    }

    expect(dialogContainer).toHaveStyle({ alignItems: "flex-end" });
    expect(dialogPaper).toHaveStyle({ margin: "0px" });
  });

  it("按当前主题渲染账户表单插图", () => {
    const { container } = renderWithUserTheme(
      <AccountDialogIllustrationSlot />,
    );
    const illustration = container.querySelector("img");

    if (!(illustration instanceof HTMLImageElement)) {
      throw new Error("账户表单插图未渲染。");
    }

    expect(illustration).toHaveAttribute(
      "src",
      "/assets/kura-account-form/account_illustration_amber_warmth.png",
    );
  });
});
