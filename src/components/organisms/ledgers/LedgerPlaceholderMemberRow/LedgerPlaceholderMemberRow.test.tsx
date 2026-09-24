import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LedgerPlaceholderMemberRow } from "./LedgerPlaceholderMemberRow";

afterEach(() => {
  cleanup();
});

const placeholder = { displayName: "奶奶", id: "placeholder-1" };
const invite = {
  createdAt: "2026-09-01T00:00:00.000Z",
  id: "invite-1",
  placeholderId: placeholder.id,
  role: "viewer" as const,
  token: "a".repeat(64),
};

describe("LedgerPlaceholderMemberRow", () => {
  it("无邀请时显示名字与待邀请", () => {
    render(
      <LedgerPlaceholderMemberRow
        canManage
        onClick={vi.fn()}
        row={{ invite: null, placeholder }}
      />,
    );

    expect(screen.getByRole("button", { name: "奶奶，待邀请" })).toBeVisible();
    expect(screen.getByText("尚未生成邀请链接")).toBeInTheDocument();
  });

  it("有绑定邀请时在同一行显示待接受邀请与角色", () => {
    render(
      <LedgerPlaceholderMemberRow
        canManage
        onClick={vi.fn()}
        row={{ invite, placeholder }}
      />,
    );

    expect(
      screen.getByRole("button", { name: "奶奶，待接受邀请" }),
    ).toBeVisible();
    expect(screen.getByText(/只读（Viewer）/)).toBeInTheDocument();
  });

  it("非管理者只看到占位摘要，不显示邀请状态", () => {
    render(
      <LedgerPlaceholderMemberRow
        canManage={false}
        onClick={vi.fn()}
        row={{ invite: null, placeholder }}
      />,
    );

    expect(screen.getByText("可作为账户持有人，不计入成员数")).toBeVisible();
    expect(screen.queryByText("尚未生成邀请链接")).toBeNull();
  });

  it("点击时触发回调", () => {
    const onClick = vi.fn();
    render(
      <LedgerPlaceholderMemberRow
        canManage
        onClick={onClick}
        row={{ invite: null, placeholder }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "奶奶，待邀请" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
