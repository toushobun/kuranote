import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProtectedLayoutShell } from "./ProtectedLayoutShell";

vi.mock("next/script", () => ({
  default: (props: Record<string, unknown>): ReactNode => {
    const htmlProp = props["dangerously" + "SetInnerHTML"] as
      | { __html?: string }
      | undefined;

    return (
      <div
        data-testid="theme-init-script"
        data-script-id={String(props.id)}
        data-script-html={htmlProp?.__html}
        data-strategy={String(props.strategy)}
      />
    );
  },
}));

vi.mock("templates/protected/AppShell", () => ({
  AppShell: ({
    children,
    email,
  }: {
    children: ReactNode;
    email: string;
  }): ReactNode => (
    <div data-testid="app-shell" data-email={email}>
      {children}
    </div>
  ),
}));

vi.mock("theme/userThemeInitScript", () => ({
  createUserThemeInitScript: (email: string): string =>
    `window.__themeEmail = ${JSON.stringify(email)};`,
}));

afterEach(() => {
  cleanup();
});

describe("ProtectedLayoutShell", () => {
  it("使用 Next Script 在交互前初始化用户主题", () => {
    render(
      <ProtectedLayoutShell email="test@example.com">
        <div>受保护内容</div>
      </ProtectedLayoutShell>,
    );

    const script = screen.getByTestId("theme-init-script");

    expect(script.getAttribute("data-script-id")).toBe("user-theme-init");
    expect(script.getAttribute("data-strategy")).toBe("beforeInteractive");
    expect(script.getAttribute("data-script-html")).toContain(
      "test@example.com",
    );
  });

  it("将用户邮箱继续传给 AppShell", () => {
    render(
      <ProtectedLayoutShell email="test@example.com">
        <div>受保护内容</div>
      </ProtectedLayoutShell>,
    );

    expect(screen.getByTestId("app-shell").getAttribute("data-email")).toBe(
      "test@example.com",
    );
    expect(screen.getByText("受保护内容")).toBeTruthy();
  });
});
