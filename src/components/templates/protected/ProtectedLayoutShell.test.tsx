import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProtectedLayoutShell } from "./ProtectedLayoutShell";

vi.mock("templates/protected/AppShell", () => ({
  AppShell: ({
    children,
    themeKey,
    transactionColorScheme,
  }: {
    children: ReactNode;
    themeKey: string;
    transactionColorScheme: string;
  }): ReactNode => (
    <div
      data-testid="app-shell"
      data-theme-key={themeKey}
      data-transaction-color-scheme={transactionColorScheme}
    >
      {children}
    </div>
  ),
}));

afterEach(() => {
  cleanup();
});

describe("ProtectedLayoutShell", () => {
  it("将用户主题与收支配色继续传给 AppShell", () => {
    render(
      <ProtectedLayoutShell
        themeKey="sakuraStory"
        transactionColorScheme="expense_green_income_red"
      >
        <div>受保护内容</div>
      </ProtectedLayoutShell>,
    );

    expect(screen.getByTestId("app-shell").getAttribute("data-theme-key")).toBe(
      "sakuraStory",
    );
    expect(screen.getByText("受保护内容")).toBeInTheDocument();
    expect(
      screen
        .getByTestId("app-shell")
        .getAttribute("data-transaction-color-scheme"),
    ).toBe("expense_green_income_red");
  });
});
