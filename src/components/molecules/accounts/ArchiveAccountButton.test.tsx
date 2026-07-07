import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserThemeProvider } from "theme/UserThemeProvider";

import { ArchiveAccountButton } from "./ArchiveAccountButton";

const actionLabel = String.fromCharCode(21024, 38500, 36134, 25143);
const dialogTitle = `${actionLabel}？`;
const confirmLabel = String.fromCharCode(21024, 38500);

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-user-theme");
});

function renderWithUserTheme(children: ReactNode) {
  return render(
    <UserThemeProvider storageScope="archive-account-button-test">
      {children}
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

    expect(
      screen.getByRole("heading", { name: dialogTitle }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: confirmLabel }),
    ).toBeInTheDocument();
  });

  it("取消时关闭弹窗", () => {
    const handleSubmit = vi.fn();

    renderWithUserTheme(
      <form onSubmit={handleSubmit}>
        <ArchiveAccountButton />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: actionLabel }));
    fireEvent.click(screen.getByRole("button", { name: "取消" }));

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: dialogTitle })).toBeNull();
  });
});
