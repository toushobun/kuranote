import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ledgerPageMessages,
  ledgerSettingsPageMessages,
} from "config/ledgerMessages";
import { routePaths } from "config/paths";

import LedgerSettingsLoadingPage from "./loading";

describe("LedgerSettingsLoadingPage", () => {
  it("显示账本设置自己的加载骨架，而不是账本管理的骨架", () => {
    render(<LedgerSettingsLoadingPage />);

    expect(
      screen.getByRole("status", { name: ledgerSettingsPageMessages.loading }),
    ).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByRole("heading", { name: ledgerSettingsPageMessages.title }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: ledgerPageMessages.title }),
    ).not.toBeInTheDocument();
  });

  it("返回按钮直接显示真实内容", () => {
    render(<LedgerSettingsLoadingPage />);

    expect(
      screen.getByRole("link", {
        name: ledgerSettingsPageMessages.backToLedgers,
      }),
    ).toHaveAttribute("href", routePaths.ledgers);
  });
});
