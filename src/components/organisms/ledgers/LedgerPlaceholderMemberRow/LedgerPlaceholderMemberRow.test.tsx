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
  it("未生成链接时显示名字与未生成链接状态", () => {
    render(
      <LedgerPlaceholderMemberRow
        canManage
        onClick={vi.fn()}
        row={{ invite: null, placeholder }}
      />,
    );

    expect(
      screen.getByRole("button", { name: "奶奶，未生成链接" }),
    ).toBeVisible();
    expect(screen.getByText("点开可生成专属邀请链接")).toBeInTheDocument();
  });

  it("已生成链接时显示等待加入、角色与创建时间", () => {
    render(
      <LedgerPlaceholderMemberRow
        canManage
        onClick={vi.fn()}
        row={{ invite, placeholder }}
      />,
    );

    expect(
      screen.getByRole("button", { name: "奶奶，等待加入" }),
    ).toBeVisible();
    expect(screen.getByText(/^只读（Viewer） · /)).toBeInTheDocument();
  });

  it("非管理者只看到占位摘要，不显示邀请状态", () => {
    render(
      <LedgerPlaceholderMemberRow
        canManage={false}
        onClick={vi.fn()}
        row={{ invite: null, placeholder }}
      />,
    );

    expect(screen.getByRole("button", { name: "奶奶，待邀请" })).toBeVisible();
    expect(screen.getByText("可作为账户持有人，不计入成员数")).toBeVisible();
    expect(screen.queryByText("未生成链接")).toBeNull();
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

    fireEvent.click(screen.getByRole("button", { name: "奶奶，未生成链接" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
