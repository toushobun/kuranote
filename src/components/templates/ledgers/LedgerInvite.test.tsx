import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LedgerInviteTemplate } from "./LedgerInvite";

const acceptAction = vi.fn(async () => {});

const validPreview = {
  inviteRole: "member" as const,
  inviterName: "淞文",
  ledgerName: "家庭账本",
  status: "valid" as const,
};

describe("LedgerInviteTemplate", () => {
  it("未登录时显示登录入口和邀请插图", () => {
    render(
      <LedgerInviteTemplate
        acceptAction={acceptAction}
        isAuthenticated={false}
        preview={validPreview}
        token="invite-token"
      />,
    );

    expect(screen.getByText("邀请你加入账本")).toBeInTheDocument();
    expect(screen.getByText("家庭账本")).toBeInTheDocument();
    expect(screen.getByText("用户（Member）")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "登录后加入" })).toHaveAttribute(
      "href",
      "/login?next=%2Finvite%2Finvite-token",
    );
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

  it("已登录且邀请有效时显示加入表单", () => {
    render(
      <LedgerInviteTemplate
        acceptAction={acceptAction}
        isAuthenticated
        preview={validPreview}
        token="invite-token"
      />,
    );

    expect(screen.getByRole("button", { name: "加入账本" })).toBeEnabled();
    expect(screen.getByDisplayValue("invite-token")).toHaveAttribute(
      "name",
      "token",
    );
    expect(screen.getByRole("link", { name: "取消" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });

  it("已加入时显示进入账本入口和已加入插图", () => {
    render(
      <LedgerInviteTemplate
        acceptAction={acceptAction}
        isAuthenticated
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
          acceptAction={acceptAction}
          isAuthenticated
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
});
