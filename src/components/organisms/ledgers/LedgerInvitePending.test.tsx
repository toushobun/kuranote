import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LedgerInviteEntry } from "./LedgerInviteEntry";
import { LedgerInvitePendingProvider } from "./LedgerInvitePendingContext";

const pendingInvites = [
  {
    createdAt: "2026-07-13T10:00:00.000Z",
    id: "invite-admin",
    role: "admin" as const,
  },
  {
    createdAt: "2026-07-13T09:00:00.000Z",
    id: "invite-member",
    role: "member" as const,
  },
  {
    createdAt: "2026-07-13T08:00:00.000Z",
    id: "invite-viewer",
    role: "viewer" as const,
  },
];

beforeEach(() => {
  window.history.replaceState(null, "", "/ledgers/ledger-1/settings");
});

function renderEntry(canInvite = true) {
  return render(
    <LedgerInvitePendingProvider pendingInvites={pendingInvites}>
      <LedgerInviteEntry
        action={vi.fn(async () => {})}
        canInvite={canInvite}
        ledgerId="ledger-1"
      />
    </LedgerInvitePendingProvider>,
  );
}

describe("LedgerInviteEntry 待接受邀请", () => {
  it("展示 Admin、Member、Viewer 三种待接受邀请", () => {
    renderEntry();

    expect(screen.getByText(/管理员（Admin）/)).toBeInTheDocument();
    expect(screen.getByText(/用户（Member）/)).toBeInTheDocument();
    expect(screen.getByText(/只读（Viewer）/)).toBeInTheDocument();
  });

  it("点击条目先打开详情，不直接打开撤销确认", () => {
    renderEntry();
    fireEvent.click(
      screen.getByRole("button", { name: /待接受邀请，用户（Member）/ }),
    );

    expect(
      screen.getByRole("heading", { name: "邀请详情" }),
    ).toBeInTheDocument();
    expect(screen.getByText("等待接受")).toBeInTheDocument();
    expect(screen.getByText("创建时间")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "确认撤销邀请？" }),
    ).not.toBeInTheDocument();
  });

  it("详情中的撤销入口仍要求二次确认", () => {
    renderEntry();
    fireEvent.click(
      screen.getByRole("button", { name: /待接受邀请，用户（Member）/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "撤销邀请" }));

    expect(
      screen.getByRole("heading", { name: "确认撤销邀请？" }),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByDisplayValue("invite-member")
        .some((input) => input.getAttribute("name") === "inviteId"),
    ).toBe(true);
  });

  it("同页替换成功后关闭旧详情并展示新链接", async () => {
    renderEntry();
    fireEvent.click(
      screen.getByRole("button", { name: /待接受邀请，用户（Member）/ }),
    );

    window.history.pushState(
      null,
      "",
      "/ledgers/ledger-1/settings#inviteId=invite-new&inviteRole=member&inviteToken=new-token",
    );
    fireEvent(window, new Event("hashchange"));

    expect(
      await screen.findByRole("heading", { name: "邀请成员" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "邀请详情" }),
    ).not.toBeInTheDocument();
    expect(screen.getByDisplayValue(/new-token/)).toBeInTheDocument();
  });

  it("同页撤销成功后关闭旧弹窗并清理结果参数", async () => {
    renderEntry();
    fireEvent.click(
      screen.getByRole("button", { name: /待接受邀请，用户（Member）/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "撤销邀请" }));

    window.history.pushState(
      null,
      "",
      "/ledgers/ledger-1/settings?inviteResult=revoked",
    );
    fireEvent(window, new Event("popstate"));

    expect(await screen.findByText("邀请已撤销")).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "确认撤销邀请？" }),
      ).not.toBeInTheDocument();
    });
    await waitFor(() => expect(window.location.search).toBe(""));
  });

  it("刷新后详情提供安全重新生成入口，不展示不可恢复的旧链接", () => {
    renderEntry();
    fireEvent.click(
      screen.getByRole("button", { name: /待接受邀请，用户（Member）/ }),
    );

    expect(screen.getByText(/刷新后无法再次读取原链接/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "重新生成链接" }),
    ).toHaveAttribute("type", "submit");
  });

  it("无管理权限仍可查看详情，但不展示替换或撤销操作", () => {
    renderEntry(false);
    const row = screen.getByRole("button", {
      name: /待接受邀请，用户（Member）/,
    });
    expect(row).not.toBeDisabled();
    fireEvent.click(row);

    expect(
      screen.getByRole("heading", { name: "邀请详情" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "重新生成链接" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "撤销邀请" }),
    ).not.toBeInTheDocument();
  });
});
