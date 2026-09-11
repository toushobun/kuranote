import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { UserThemeProvider } from "theme/UserThemeProvider";

import { DestructiveSubmitButton } from "./DestructiveSubmitButton";

const buttonProps = {
  confirmLabel: "删除账户",
  description: "删除后该账户将从账户列表中隐藏，历史记录不会被删除。",
  label: "删除",
  title: "删除账户？",
} as const;

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-user-theme");
});

function renderWithUserTheme(children: ReactNode) {
  return render(
    <UserThemeProvider storageScope="destructive-submit-button-test">
      <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
    </UserThemeProvider>,
  );
}

describe("DestructiveSubmitButton", () => {
  it("渲染按钮", () => {
    renderWithUserTheme(
      <form>
        <DestructiveSubmitButton {...buttonProps} />
      </form>,
    );

    expect(screen.getByRole("button", { name: "删除" })).toBeInTheDocument();
  });

  it("点击后显示统一确认弹窗", () => {
    renderWithUserTheme(
      <form>
        <DestructiveSubmitButton {...buttonProps} />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "删除" }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "删除账户？" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "取消" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "删除账户" }),
    ).toBeInTheDocument();
  });

  it("确认后提交指定表单", async () => {
    const handleSubmit = vi.fn();

    renderWithUserTheme(
      <>
        <form
          id="archive-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        />
        <DestructiveSubmitButton {...buttonProps} formId="archive-form" />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "删除账户",
      }),
    );

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("取消时关闭弹窗且不提交", async () => {
    const handleSubmit = vi.fn();

    renderWithUserTheme(
      <form onSubmit={handleSubmit}>
        <DestructiveSubmitButton {...buttonProps} />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    fireEvent.click(screen.getByRole("button", { name: "取消" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "删除账户？" }),
      ).toBeNull();
    });
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
