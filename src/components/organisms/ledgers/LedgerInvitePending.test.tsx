import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LedgerInviteEntry } from "./LedgerInviteEntry";
import { LedgerInvitePendingProvider } from "./LedgerInvitePendingContext";

const pendingInvites = [
  {
    createdAt: "2026-07-13T10:00:00.000Z",
    id: "invite-admin",
    role: "admin" as const,
    token: "admin-token",
  },
  {
    createdAt: "2026-07-13T09:00:00.000Z",
    id: "invite-member",
    role: "member" as const,
    token: "member-token",
  },
  {
    createdAt: "2026-07-13T08:00:00.000Z",
    id: "invite-viewer",
    role: "viewer" as const,
    token: "viewer-token",
  },
];

beforeEach(() => {
  window.history.replaceState(null, "", "/ledgers/ledger-1/settings");
});

function renderEntry(canInvite = true) {
  const visibleInvites = canInvite
    ? pendingInvites
    : pendingInvites.map((invite) => ({ ...invite, token: null }));

  return render(
    <LedgerInvitePendingProvider pendingInvites={visibleInvites}>
      <LedgerInviteEntry
        action={vi.fn(async () => {})}
        canInvite={canInvite}
        ledgerId="ledger-1"
        ledgerName="家庭账本"
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

  it("刷新后详情仍显示同一邀请链接和对应二维码", () => {
    renderEntry();
    fireEvent.click(
      screen.getByRole("button", { name: /待接受邀请，用户（Member）/ }),
    );

    const linkField = screen.getByDisplayValue(/\/invite\/member-token/);
    const qrCode = screen.getByRole("img", {
      name: "账本邀请二维码，家庭账本",
    });

    expect(linkField).toBeInTheDocument();
    expect(qrCode).toHaveAttribute(
      "data-qr-value",
      expect.stringContaining("/invite/member-token"),
    );
    expect(
      screen.queryByRole("button", { name: "重新生成链接" }),
    ).not.toBeInTheDocument();
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

  it("无管理权限仍可查看详情，但不能读取链接、二维码或撤销", () => {
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
      screen.getByText("仅管理员或所有者可以查看邀请链接和二维码。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: /账本邀请二维码/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "复制链接" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "撤销邀请" }),
    ).not.toBeInTheDocument();
  });
});
