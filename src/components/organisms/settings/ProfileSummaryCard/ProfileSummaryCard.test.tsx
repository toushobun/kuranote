import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  getDisplayNameInitial,
  ProfileSummaryCard,
} from "./ProfileSummaryCard";

afterEach(() => {
  cleanup();
});

describe("ProfileSummaryCard", () => {
  it("显示昵称与登录邮箱", () => {
    render(
      <ProfileSummaryCard
        avatarUrl={null}
        displayName="淞文"
        email="user@example.com"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "淞文" }),
    ).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("没有头像时显示昵称首字", () => {
    render(
      <ProfileSummaryCard avatarUrl={null} displayName="kura" email={null} />,
    );

    expect(screen.getByText("K")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("有头像时显示头像图片", () => {
    render(
      <ProfileSummaryCard
        avatarUrl="https://example.com/avatar.png"
        displayName="淞文"
        email={null}
      />,
    );

    expect(screen.getByRole("img", { name: "淞文" })).toHaveAttribute(
      "src",
      "https://example.com/avatar.png",
    );
  });
});

describe("getDisplayNameInitial", () => {
  it("取去除空白后的首个字符", () => {
    expect(getDisplayNameInitial("  淞文")).toBe("淞");
    expect(getDisplayNameInitial("😀Kura")).toBe("😀");
    expect(getDisplayNameInitial("")).toBe("");
  });
});
