import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LedgerInviteLoadingPage from "./loading";

describe("LedgerInviteLoadingPage", () => {
  it("显示邀请确认页加载骨架", () => {
    render(<LedgerInviteLoadingPage />);

    expect(
      screen.getByRole("status", { name: "邀请确认页加载中" }),
    ).toHaveAttribute("aria-busy", "true");
  });
});
