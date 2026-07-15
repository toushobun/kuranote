import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LedgerInviteEntry } from "./LedgerInviteEntry";
import { ledgerInviteErrorOperations } from "config/paths";

const writeText = vi.fn(async () => {});

beforeEach(() => {
  Object.assign(navigator, { clipboard: { writeText } });
  window.history.replaceState(null, "", "/ledgers/ledger-1/settings");
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderEntry() {
  return render(
    <LedgerInviteEntry
      action={vi.fn(async () => {})}
      canInvite
      ledgerId="ledger-1"
    />,
  );
}

describe("LedgerInviteEntry", () => {
  it("新邀请默认选择 Member，并可切换 Admin 与 Viewer", async () => {
    renderEntry();
    fireEvent.click(screen.getByRole("button", { name: /邀请成员/ }));

    expect(screen.getByText("权限")).toBeInTheDocument();
    const roleButton = screen.getByRole("button", { name: /选择邀请权限/ });
    expect(roleButton).toHaveTextContent("用户（Member）");

    fireEvent.click(roleButton);
    expect(screen.queryByText("所有者（Owner）")).not.toBeInTheDocument();
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "管理员（Admin）" }),
    );
    expect(
      screen.getByRole("button", { name: /选择邀请权限/ }),
    ).toHaveTextContent("管理员（Admin）");
    expect(screen.getByDisplayValue("admin")).toHaveAttribute("name", "role");
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
    expect(await screen.findByDisplayValue(/invite-token/)).toBeInTheDocument();

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

  it("错误显示后会清理查询参数", async () => {
    window.history.replaceState(
      null,
      "",
      "/ledgers/ledger-1/settings?inviteError=create_failed&inviteErrorKey=error-1&inviteOperation=create",
    );
    render(
      <LedgerInviteEntry
        action={vi.fn(async () => {})}
        canInvite
        errorKey="error-1"
        errorMessage="邀请链接生成失败。"
        ledgerId="ledger-1"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("邀请链接生成失败。");
    await waitFor(() => expect(window.location.search).toBe(""));
  });

  it("组件未重新挂载时仍会展示新的 Action 错误", async () => {
    const action = vi.fn(async () => {});
    const { rerender } = render(
      <LedgerInviteEntry action={action} canInvite ledgerId="ledger-1" />,
    );

    rerender(
      <LedgerInviteEntry
        action={action}
        canInvite
        errorKey="error-1"
        errorMessage="邀请链接生成失败。"
        ledgerId="ledger-1"
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "邀请链接生成失败。",
    );
    expect(
      screen.getByRole("heading", { name: "邀请成员" }),
    ).toBeInTheDocument();
  });

  it("相同创建错误使用新错误标识时会再次展示", async () => {
    const action = vi.fn(async () => {});
    const { rerender } = render(
      <LedgerInviteEntry
        action={action}
        canInvite
        errorKey="error-1"
        errorMessage="邀请链接生成失败。"
        ledgerId="ledger-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "邀请成员" }),
      ).not.toBeInTheDocument();
    });

    rerender(
      <LedgerInviteEntry
        action={action}
        canInvite
        errorKey="error-2"
        errorMessage="邀请链接生成失败。"
        ledgerId="ledger-1"
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "邀请成员" }),
    ).toBeInTheDocument();
  });

  it.each([
    [ledgerInviteErrorOperations.replace, "重新生成邀请链接失败"],
    [ledgerInviteErrorOperations.revoke, "撤销邀请失败"],
  ] as const)("%s 失败时展示对应反馈且不打开新建窗口", (operation, title) => {
    render(
      <LedgerInviteEntry
        action={vi.fn(async () => {})}
        canInvite
        errorKey="error-1"
        errorMessage="邀请已失效。"
        errorOperation={operation}
        ledgerId="ledger-1"
      />,
    );

    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText("邀请已失效。")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "邀请成员" }),
    ).not.toBeInTheDocument();
  });

  it("打开全新邀请草稿时清除旧管理错误", async () => {
    render(
      <LedgerInviteEntry
        action={vi.fn(async () => {})}
        canInvite
        errorKey="error-1"
        errorMessage="邀请已失效。"
        errorOperation={ledgerInviteErrorOperations.replace}
        ledgerId="ledger-1"
      />,
    );

    expect(screen.getByText("重新生成邀请链接失败")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /邀请成员/ }));

    expect(
      screen.getByRole("heading", { name: "邀请成员" }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByText("重新生成邀请链接失败"),
      ).not.toBeInTheDocument();
    });
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
