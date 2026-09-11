import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { UserThemeProvider } from "theme/UserThemeProvider";

import { ArchiveAccountButton } from "./ArchiveAccountButton";

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
  it("保留账户删除的默认确认文案", () => {
    renderWithUserTheme(
      <form>
        <ArchiveAccountButton />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "删除账户" }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "删除账户？" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "删除账户" }),
    ).toBeInTheDocument();
  });

  it("自定义触发按钮文案时仍使用账户删除确认文案", () => {
    renderWithUserTheme(
      <form>
        <ArchiveAccountButton label="删除" />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "删除" }));

    expect(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "删除账户",
      }),
    ).toBeInTheDocument();
  });
});
