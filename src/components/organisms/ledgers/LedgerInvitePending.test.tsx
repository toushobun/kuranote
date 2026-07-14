import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LedgerInviteEntry } from "./LedgerInviteEntry";
import { LedgerInvitePendingProvider } from "./LedgerInvitePendingContext";

const pendingInvites = [
  {
    createdAt: "2026-07-13T09:00:00.000Z",
    id: "invite-1",
    role: "member" as const,
  },
  {
    createdAt: "2026-07-13T08:00:00.000Z",
    id: "invite-2",
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
  it("在成员列表区域展示服务端加载的待接受邀请", () => {
    renderEntry();

    expect(screen.getAllByText("待接受邀请")).toHaveLength(2);
    expect(screen.getByText(/用户（Member）/)).toBeInTheDocument();
    expect(screen.getByText(/只读（Viewer）/)).toBeInTheDocument();
    expect(screen.getAllByText("撤销")).toHaveLength(2);
  });

  it("多个待邀请行具有可区分的可访问名称", () => {
    renderEntry();

    const buttons = screen.getAllByRole("button", { name: /待接受邀请/ });
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAccessibleName(/成员/);
    expect(buttons[1]).toHaveAccessibleName(/只读/);
  });

  it("点击待接受邀请后显示撤销确认与邀请标识", () => {
    renderEntry();

    fireEvent.click(screen.getByRole("button", { name: /待接受邀请，成员/ }));

    expect(
      screen.getByRole("heading", { name: "撤销邀请" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("invite-1")).toHaveAttribute(
      "name",
      "inviteId",
    );
    expect(screen.getByDisplayValue("revoke")).toHaveAttribute(
      "name",
      "intent",
    );
  });

  it("无管理权限时展示状态但不能执行撤销", () => {
    renderEntry(false);

    screen
      .getAllByRole("button", { name: /待接受邀请/ })
      .forEach((button) => expect(button).toBeDisabled());
    expect(screen.getAllByText("等待接受")).toHaveLength(2);
  });

  it("撤销成功参数显示反馈并清理地址栏", async () => {
    window.history.replaceState(
      null,
      "",
      "/ledgers/ledger-1/settings?inviteResult=revoked",
    );

    renderEntry();

    expect(await screen.findByText("邀请已撤销")).toBeInTheDocument();
    await waitFor(() => {
      expect(window.location.search).toBe("");
    });
  });
});
