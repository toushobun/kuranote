import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LedgerInvitePendingProvider } from "organisms/ledgers/LedgerInvitePendingContext/LedgerInvitePendingContext";
import {
  type LedgerInviteActionState,
  type LedgerInviteStateAction,
  type PendingLedgerInvite,
} from "types/ledgers";
import { LedgerInviteEntry } from "./LedgerInviteEntry";

describe("LedgerInviteEntry.test.tsx", () => {
  const writeText = vi.fn(async () => {});

  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText } });
    window.history.replaceState(null, "", "/ledgers/ledger-1/settings");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderEntry(
    action: LedgerInviteStateAction = vi.fn(
      async (state: LedgerInviteActionState) => state,
    ),
    pendingInvites: PendingLedgerInvite[] = [],
  ) {
    return render(
      <LedgerInvitePendingProvider pendingInvites={pendingInvites}>
        <LedgerInviteEntry action={action} canInvite ledgerId="ledger-1" />
      </LedgerInvitePendingProvider>,
    );
  }

  const pendingInvite: PendingLedgerInvite = {
    createdAt: "2026-07-24T00:00:00.000Z",
    id: "invite-1",
    role: "member",
    token: "invite-token",
  };

  describe("LedgerInviteEntry", () => {
    it("新邀请默认选择 Member，并可切换 Admin 与 Viewer", async () => {
      const action = vi.fn(async (state: LedgerInviteActionState) => state);
      renderEntry(action);
      fireEvent.click(screen.getByRole("button", { name: /邀请成员/ }));

      expect(screen.getByText("权限")).toBeInTheDocument();
      const roleButton = screen.getByRole("button", { name: /选择邀请权限/ });
      expect(roleButton).toHaveTextContent("用户（Member）");
      expect(roleButton).toHaveAttribute("type", "button");

      fireEvent.click(roleButton);
      expect(screen.queryByText("所有者（Owner）")).not.toBeInTheDocument();
      fireEvent.click(
        await screen.findByRole("menuitem", { name: "管理员（Admin）" }),
      );
      expect(
        screen.getByRole("button", { name: /选择邀请权限/ }),
      ).toHaveTextContent("管理员（Admin）");
      expect(screen.getByDisplayValue("admin")).toHaveAttribute("name", "role");
      expect(action).not.toHaveBeenCalled();
    });

    it("邀请表单内的菜单、复制与关闭按钮不会提交表单", async () => {
      const action = vi.fn(async (state: LedgerInviteActionState) => state);
      window.history.replaceState(
        null,
        "",
        "/ledgers/ledger-1/settings#inviteId=invite-1&inviteRole=member&inviteToken=invite-token",
      );
      renderEntry(action);

      const copyButton = await screen.findByRole("button", { name: "复制" });
      const closeButton = screen.getByRole("button", { name: "关闭" });

      expect(copyButton).toHaveAttribute("type", "button");
      expect(closeButton).toHaveAttribute("type", "button");
      fireEvent.click(copyButton);
      fireEvent.click(closeButton);

      expect(action).not.toHaveBeenCalled();
    });

    it("创建成功后显示一次提示并清理 fragment", async () => {
      window.history.replaceState(
        null,
        "",
        "/ledgers/ledger-1/settings#inviteId=invite-1&inviteRole=viewer&inviteToken=invite-token",
      );
      const { unmount } = renderEntry();

      expect(
        await screen.findByText("创建链接成功，快去复制给你的亲友吧"),
      ).toBeInTheDocument();
      expect(window.location.hash).toBe("");
      unmount();

      renderEntry();
      expect(
        screen.queryByText("创建链接成功，快去复制给你的亲友吧"),
      ).not.toBeInTheDocument();
    });

    it("组件未重新挂载时仍会消费后续创建结果", async () => {
      renderEntry();

      window.history.pushState(
        null,
        "",
        "/ledgers/ledger-1/settings#inviteId=invite-2&inviteRole=admin&inviteToken=second-token",
      );
      fireEvent(window, new Event("hashchange"));

      expect(
        await screen.findByText("创建链接成功，快去复制给你的亲友吧"),
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue(/second-token/)).toBeInTheDocument();
      expect(screen.getByText("管理员（Admin）")).toBeInTheDocument();
      expect(window.location.hash).toBe("");
    });

    it("复制成功后显示明确反馈", async () => {
      window.history.replaceState(
        null,
        "",
        "/ledgers/ledger-1/settings#inviteId=invite-1&inviteRole=member&inviteToken=invite-token",
      );
      renderEntry();

      fireEvent.click(await screen.findByRole("button", { name: "复制链接" }));
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining("/invite/invite-token"),
      );
      expect(await screen.findByText("复制成功")).toBeInTheDocument();
    });

    it("复制失败时不显示成功提示", async () => {
      writeText.mockRejectedValueOnce(new Error("denied"));
      window.history.replaceState(
        null,
        "",
        "/ledgers/ledger-1/settings#inviteId=invite-1&inviteRole=member&inviteToken=invite-token",
      );
      renderEntry();

      fireEvent.click(await screen.findByRole("button", { name: "复制链接" }));
      expect(
        await screen.findByText("复制失败，请手动复制邀请链接"),
      ).toBeInTheDocument();
      expect(screen.queryByText("复制成功")).not.toBeInTheDocument();
    });

    it("再次点击邀请成员会清空旧链接、反馈并恢复 Member", async () => {
      window.history.replaceState(
        null,
        "",
        "/ledgers/ledger-1/settings#inviteId=invite-1&inviteRole=admin&inviteToken=invite-token",
      );
      renderEntry();
      expect(
        await screen.findByDisplayValue(/invite-token/),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "关闭" }));
      await waitFor(() => {
        expect(
          screen.queryByRole("heading", { name: "邀请成员" }),
        ).not.toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole("button", { name: /邀请成员/ }));

      expect(
        screen.getByDisplayValue("生成后将在这里显示邀请链接"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /选择邀请权限/ }),
      ).toHaveTextContent("用户（Member）");
      expect(
        screen.getByRole("button", { name: "生成邀请链接" }),
      ).toHaveAttribute("type", "submit");
    });

    it("创建失败时保留所选权限且 URL 不携带错误参数", async () => {
      const action = vi.fn(async () => ({
        error: "邀请链接生成失败，请稍后重试。",
        errorKey: "create-error-1",
        operation: "create" as const,
      }));
      renderEntry(action);

      fireEvent.click(screen.getByRole("button", { name: /邀请成员/ }));
      fireEvent.click(screen.getByRole("button", { name: /选择邀请权限/ }));
      fireEvent.click(
        await screen.findByRole("menuitem", { name: "管理员（Admin）" }),
      );
      fireEvent.click(screen.getByRole("button", { name: "生成邀请链接" }));

      expect(await screen.findByText("生成邀请链接失败")).toBeInTheDocument();
      expect(
        screen.getByText("邀请链接生成失败，请稍后重试。"),
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("admin")).toHaveAttribute("name", "role");
      expect(window.location.search).toBe("");
      expect(window.location.href).not.toContain("inviteError");
      expect(window.location.href).not.toContain("errorKey");
    });

    it("撤销失败时展示对应弹框且不打开新建窗口", async () => {
      const action = vi.fn(async () => ({
        error: "该邀请链接已经被使用，无法撤销。",
        errorKey: "revoke-error-1",
        operation: "revoke" as const,
      }));
      renderEntry(action, [pendingInvite]);

      fireEvent.click(screen.getByRole("button", { name: /待接受邀请/ }));
      fireEvent.click(screen.getByRole("button", { name: "撤销邀请" }));
      fireEvent.click(screen.getByRole("button", { name: "确认撤销" }));

      expect(await screen.findByText("撤销邀请失败")).toBeInTheDocument();
      expect(
        screen.getByText("该邀请链接已经被使用，无法撤销。"),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "邀请成员" }),
      ).not.toBeInTheDocument();
      expect(window.location.search).toBe("");
    });

    it("相同错误使用新错误标识时会再次展示", async () => {
      let errorCount = 0;
      const action = vi.fn(async () => {
        errorCount += 1;
        return {
          error: "邀请链接生成失败，请稍后重试。",
          errorKey: `create-error-${errorCount}`,
          operation: "create" as const,
        };
      });
      renderEntry(action);

      fireEvent.click(screen.getByRole("button", { name: /邀请成员/ }));
      fireEvent.click(screen.getByRole("button", { name: "生成邀请链接" }));
      const firstAlert = await screen.findByRole("alert");
      expect(firstAlert).toHaveTextContent("生成邀请链接失败");

      fireEvent.click(within(firstAlert).getByRole("button", { name: "关闭" }));
      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "生成邀请链接" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "生成邀请链接失败",
      );
      expect(action).toHaveBeenCalledTimes(2);
    });

    it("页面刷新后不会重复展示已处理的 Action 错误", async () => {
      const action = vi.fn(async () => ({
        error: "邀请链接生成失败，请稍后重试。",
        errorKey: "create-error-1",
        operation: "create" as const,
      }));
      const { unmount } = renderEntry(action);

      fireEvent.click(screen.getByRole("button", { name: /邀请成员/ }));
      fireEvent.click(screen.getByRole("button", { name: "生成邀请链接" }));
      expect(await screen.findByText("生成邀请链接失败")).toBeInTheDocument();
      unmount();

      renderEntry(action);
      expect(screen.queryByText("生成邀请链接失败")).not.toBeInTheDocument();
      expect(window.location.search).toBe("");
    });

    it("打开全新邀请草稿时清除旧撤销成功提示", async () => {
      window.history.replaceState(
        null,
        "",
        "/ledgers/ledger-1/settings?inviteResult=revoked",
      );
      renderEntry();

      expect(await screen.findByText("邀请已撤销")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /邀请成员/ }));

      await waitFor(() => {
        expect(screen.queryByText("邀请已撤销")).not.toBeInTheDocument();
      });
    });
  });
});

describe("LedgerInviteEntry.pending.test.tsx", () => {
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
          action={vi.fn(async () => ({}))}
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
});
