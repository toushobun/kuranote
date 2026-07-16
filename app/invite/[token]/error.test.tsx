import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LedgerInviteError from "./error";

describe("LedgerInviteError", () => {
  it("展示自有错误提示并支持重新加载", () => {
    const reset = vi.fn();

    render(
      <LedgerInviteError
        error={new Error("secret invite token and server details")}
        reset={reset}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "邀请页面暂时无法加载" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "返回首页" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.queryByText(/secret invite token and server details/),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "重新加载" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
