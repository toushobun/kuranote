import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LedgerInviteQrCode } from "./LedgerInviteQrCode";

const inviteLink =
  "https://kuranote.example/invite/0123456789abcdef0123456789abcdef";

describe("LedgerInviteQrCode", () => {
  it("将邀请链接编码为可访问的二维码并显示账本说明", () => {
    render(<LedgerInviteQrCode ledgerName="家庭账本" link={inviteLink} />);

    const qrCode = screen.getByRole("img", {
      name: "账本邀请二维码，家庭账本",
    });

    expect(qrCode).toHaveAttribute("data-qr-value", inviteLink);
    expect(qrCode.querySelector("path")).toHaveAttribute("d");
    expect(screen.getByText("家庭账本")).toBeInTheDocument();
    expect(
      screen.getByText("使用手机相机扫码，打开邀请确认页"),
    ).toBeInTheDocument();
  });

  it("链接不可用时不展示可扫描二维码", () => {
    render(
      <LedgerInviteQrCode
        emptyMessage="该邀请链接已失效，无法显示二维码"
        ledgerName="家庭账本"
        link=""
      />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "该邀请链接已失效，无法显示二维码",
    );
  });
});
