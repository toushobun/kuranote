import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ledgerSetupPreviewPageMessages } from "config/ledgerSetupMessages";

import LedgerSetupPreviewLoadingPage from "./loading";

describe("LedgerSetupPreviewLoadingPage", () => {
  it("显示与预览页一致的加载骨架", () => {
    render(<LedgerSetupPreviewLoadingPage />);

    expect(
      screen.getByRole("status", {
        name: ledgerSetupPreviewPageMessages.loading,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: ledgerSetupPreviewPageMessages.title,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("ledger-setup-preview-loading-open"),
    ).toBeInTheDocument();
  });
});
