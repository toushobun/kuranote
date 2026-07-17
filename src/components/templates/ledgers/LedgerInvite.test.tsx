import { readFileSync } from "node:fs";
import { join } from "node:path";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LedgerInviteTemplate } from "./LedgerInvite";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
}));

const componentSource = readFileSync(
  join(process.cwd(), "src/components/templates/ledgers/LedgerInvite.tsx"),
  "utf8",
);

const validPreview = {
  inviteRole: "member" as const,
  inviterName: "淞文",
  ledgerName: "家庭账本",
  status: "valid" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true }),
    }),
  );
});

describe("LedgerInviteTemplate", () => {
  it("声明客户端边界以支持 MUI Link 组件", () => {
    expect(componentSource.startsWith('"use client";')).toBe(true);
  });

  it("有效邀请显示加入按钮和邀请插图", () => {
    render(
      <LedgerInviteTemplate preview={validPreview} token="invite-token" />,
    );

    expect(screen.getByText("邀请你加入账本")).toBeInTheDocument();
    expect(screen.getByText("家庭账本")).toBeInTheDocument();
    expect(screen.getByText("用户（Member）")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "加入账本" })).toBeEnabled();
    expect(screen.queryByDisplayValue("invite-token")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "取消" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(
      screen.getByRole("img", { name: "邀请加入账本插图" }),
    ).toHaveAttribute(
      "src",
      expect.stringContaining("invite_illustration.png"),
    );
  });

  it("接受邀请成功后进入 Dashboard 并刷新", async () => {
    render(
      <LedgerInviteTemplate preview={validPreview} token="invite-token" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "加入账本" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/ledger-invites/accept", {
        body: JSON.stringify({ token: "invite-token" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
    });
    expect(mocks.push).toHaveBeenCalledWith("/dashboard");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("接受邀请失败时在当前页面显示错误弹框", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({
        error: {
          code: "invite_already_revoked",
          message: "该邀请已经撤销。",
          status: 409,
        },
      }),
    } as unknown as Response);

    render(
      <LedgerInviteTemplate preview={validPreview} token="invite-token" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "加入账本" }));

    expect(await screen.findByText("加入账本失败")).toBeInTheDocument();
    expect(screen.getByText("该邀请已经撤销。")).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it.each([
    [
      "admin",
      "管理员（Admin）",
      "加入后可管理账本、成员与基础设置，并共同记录数据。",
    ],
    ["member", "用户（Member）", "加入后可共同查看和记录该账本的数据。"],
    [
      "viewer",
      "只读（Viewer）",
      "加入后可查看该账本的数据，但不能新增或修改记录。",
    ],
  ] as const)("%s 邀请展示对应权限说明", (role, label, description) => {
    render(
      <LedgerInviteTemplate
        preview={{ ...validPreview, inviteRole: role }}
        token="invite-token"
      />,
    );

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it("已加入时显示进入账本入口和已加入插图", () => {
    render(
      <LedgerInviteTemplate
        preview={{ ...validPreview, status: "already_member" }}
        token="invite-token"
      />,
    );

    expect(screen.getByText("你已经加入该账本")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "进入账本" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(
      screen.getByRole("img", { name: "已经加入账本插图" }),
    ).toHaveAttribute("src", expect.stringContaining("invite-joined.png"));
  });

  it.each(["invalid", "revoked", "accepted"] as const)(
    "%s 状态显示邀请失效和失效插图",
    (status) => {
      render(
        <LedgerInviteTemplate
          preview={{
            inviteRole: null,
            inviterName: null,
            ledgerName: null,
            status,
          }}
          token="invite-token"
        />,
      );

      expect(screen.getByText("邀请已失效")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "返回首页" })).toHaveAttribute(
        "href",
        "/dashboard",
      );
      expect(
        screen.getByRole("img", { name: "邀请已失效插图" }),
      ).toHaveAttribute("src", expect.stringContaining("invite-invalid.png"));
    },
  );

  it("公开失效邀请使用自定义退出地址", () => {
    render(
      <LedgerInviteTemplate
        exitHref="/"
        preview={{
          inviteRole: null,
          inviterName: null,
          ledgerName: null,
          status: "invalid",
        }}
        token=""
      />,
    );

    expect(screen.getByRole("link", { name: "返回" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "返回首页" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
