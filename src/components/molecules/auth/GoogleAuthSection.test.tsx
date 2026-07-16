import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GoogleAuthSection } from "./GoogleAuthSection";

afterEach(() => {
  cleanup();
});

describe("GoogleAuthSection", () => {
  it("显示 Google 登录入口和邮箱流程分隔线", () => {
    render(<GoogleAuthSection action={vi.fn(async () => {})} />);

    expect(
      screen.getByRole("button", { name: "使用 Google 账号继续" }),
    ).toBeTruthy();
    expect(screen.getByText("或")).toBeTruthy();
  });

  it("显示 OAuth 错误提示", () => {
    render(
      <GoogleAuthSection
        action={vi.fn(async () => {})}
        errorMessage="Google 登录未完成，请重新尝试。"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Google 登录未完成，请重新尝试。",
    );
  });

  it("入口关闭时仅显示 OAuth 错误提示", () => {
    render(
      <GoogleAuthSection errorMessage="暂时无法连接 Google，请稍后重试。" />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "暂时无法连接 Google，请稍后重试。",
    );
    expect(
      screen.queryByRole("button", { name: "使用 Google 账号继续" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("或")).not.toBeInTheDocument();
  });
});
