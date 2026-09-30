import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProfileSummaryCard } from "./ProfileSummaryCard";

afterEach(() => {
  cleanup();
});

describe("ProfileSummaryCard", () => {
  it("显示昵称、登录邮箱与更换头像入口", () => {
    render(
      <ProfileSummaryCard
        avatarUrl={null}
        displayName="淞文"
        email="user@example.com"
        updateAvatarAction={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "淞文" }),
    ).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "更换头像" }),
    ).toBeInTheDocument();
  });

  it("没有邮箱时不显示邮箱行", () => {
    render(
      <ProfileSummaryCard
        avatarUrl={null}
        displayName="kura"
        email={null}
        updateAvatarAction={vi.fn()}
      />,
    );

    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });
});
