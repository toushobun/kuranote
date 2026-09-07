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

import { ArchiveAccountButton } from "./ArchiveAccountButton";

const actionLabel = String.fromCharCode(21024, 38500, 36134, 25143);
const dialogTitle = `${actionLabel}？`;
const confirmLabel = actionLabel;

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-user-theme");
});

function renderWithUserTheme(children: ReactNode) {
  return render(
    <UserThemeProvider storageScope="archive-account-button-test">
      <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
    </UserThemeProvider>,
  );
}

describe("ArchiveAccountButton", () => {
  it("渲染按钮", () => {
    renderWithUserTheme(
      <form>
        <ArchiveAccountButton />
      </form>,
    );

    expect(
      screen.getByRole("button", { name: actionLabel }),
    ).toBeInTheDocument();
  });

  it("点击后显示统一确认弹窗", () => {
    renderWithUserTheme(
      <form>
        <ArchiveAccountButton />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: actionLabel }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: dialogTitle }),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: confirmLabel }),
    ).toBeInTheDocument();
  });

  it("确认后提交表单", async () => {
    const handleSubmit = vi.fn();

    renderWithUserTheme(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <ArchiveAccountButton />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: actionLabel }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: confirmLabel,
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
        <ArchiveAccountButton />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: actionLabel }));
    fireEvent.click(screen.getByRole("button", { name: "取消" }));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: dialogTitle })).toBeNull();
    });
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
