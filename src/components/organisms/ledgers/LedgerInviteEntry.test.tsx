import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LedgerInviteEntry } from "./LedgerInviteEntry";

const writeText = vi.fn(async () => {});

beforeEach(() => {
  Object.assign(navigator, { clipboard: { writeText } });
  window.history.replaceState(null, "", "/ledgers/ledger-1/settings");
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("LedgerInviteEntry", () => {
  it("可以邀请时点击入口会打开邀请弹窗", () => {
    render(
      <LedgerInviteEntry
        action={vi.fn(async () => {})}
        canInvite
        ledgerId="ledger-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /邀请成员/ }));

    expect(
      screen.getByRole("heading", { name: "邀请成员" }),
    ).toBeInTheDocument();
    expect(screen.getByText("用户（Member）")).toBeInTheDocument();
    expect(screen.getByText("即将支持二维码邀请")).toBeInTheDocument();
  });

  it("不能邀请时入口按钮禁用", () => {
    render(
      <LedgerInviteEntry
        action={vi.fn(async () => {})}
        canInvite={false}
        ledgerId="ledger-1"
      />,
    );

    expect(screen.getByRole("button", { name: /邀请成员/ })).toBeDisabled();
  });

  it("没有邀请链接时显示可提交的生成邀请链接按钮", () => {
    render(
      <LedgerInviteEntry
        action={vi.fn(async () => {})}
        canInvite
        ledgerId="ledger-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /邀请成员/ }));

    const button = screen.getByRole("button", { name: "生成邀请链接" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button.closest("form")).not.toBeNull();
  });

  it("从 fragment 读取邀请 token 后立即清理地址栏并支持复制", async () => {
    window.history.replaceState(
      null,
      "",
      "/ledgers/ledger-1/settings#inviteToken=invite-token",
    );

    render(
      <LedgerInviteEntry
        action={vi.fn(async () => {})}
        canInvite
        ledgerId="ledger-1"
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "邀请成员" }),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe("");
    expect(
      screen.queryByRole("button", { name: "撤销邀请" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "复制" }));

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("/invite/invite-token"),
    );
    expect(await screen.findByText("已复制邀请链接")).toBeInTheDocument();
  });

  it("传入错误信息时自动打开弹窗，显示错误后清理地址栏", async () => {
    window.history.replaceState(
      null,
      "",
      "/ledgers/ledger-1/settings?inviteError=create_failed",
    );

    render(
      <LedgerInviteEntry
        action={vi.fn(async () => {})}
        canInvite
        errorMessage="邀请链接生成失败。"
        ledgerId="ledger-1"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "邀请成员" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("邀请链接生成失败。");

    await waitFor(() => {
      expect(window.location.search).toBe("");
    });
  });

  it("刷新后不再显示已经消费的邀请错误", async () => {
    window.history.replaceState(
      null,
      "",
      "/ledgers/ledger-1/settings?inviteError=create_failed",
    );
    const { unmount } = render(
      <LedgerInviteEntry
        action={vi.fn(async () => {})}
        canInvite
        errorMessage="邀请链接生成失败。"
        ledgerId="ledger-1"
      />,
    );

    await waitFor(() => {
      expect(window.location.search).toBe("");
    });
    unmount();

    render(
      <LedgerInviteEntry
        action={vi.fn(async () => {})}
        canInvite
        ledgerId="ledger-1"
      />,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "邀请成员" }),
    ).not.toBeInTheDocument();
  });

  it("空的 inviteError 参数也会从地址栏删除", async () => {
    window.history.replaceState(
      null,
      "",
      "/ledgers/ledger-1/settings?inviteError=",
    );

    render(
      <LedgerInviteEntry
        action={vi.fn(async () => {})}
        canInvite
        ledgerId="ledger-1"
      />,
    );

    await waitFor(() => {
      expect(window.location.search).toBe("");
    });
  });

  it("点击关闭按钮会关闭弹窗", async () => {
    render(
      <LedgerInviteEntry
        action={vi.fn(async () => {})}
        canInvite
        ledgerId="ledger-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /邀请成员/ }));
    expect(
      screen.getByRole("heading", { name: "邀请成员" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "关闭" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "邀请成员" }),
      ).not.toBeInTheDocument();
    });
  });
});
