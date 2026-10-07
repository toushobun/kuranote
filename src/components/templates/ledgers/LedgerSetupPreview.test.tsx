import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";

import { LedgerSetupPreviewTemplate } from "./LedgerSetupPreview";

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

function renderTemplate() {
  render(
    <ConfirmDialogTestProviders>
      <LedgerSetupPreviewTemplate
        defaults={{
          baseCurrency: "JPY",
          displayColor: "amber",
          displayName: "淞文",
          ledgerName: "家庭账本",
        }}
        progress={null}
        saveDraftAction={async () => ({})}
        submitBasicInfoAction={async (state) => state}
      />
    </ConfirmDialogTestProviders>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LedgerSetupPreviewTemplate", () => {
  it("打开页面即显示创建账本向导", () => {
    renderTemplate();

    expect(
      screen.getByRole("dialog", { name: "创建账本" }),
    ).toBeInTheDocument();
  });

  it("关闭向导后刷新数据，并可以重新打开", () => {
    renderTemplate();

    fireEvent.click(screen.getByRole("button", { name: "关闭创建账本向导" }));

    expect(screen.queryByRole("dialog", { name: "创建账本" })).toBeNull();
    expect(mocks.refresh).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "打开创建账本向导" }));

    expect(
      screen.getByRole("dialog", { name: "创建账本" }),
    ).toBeInTheDocument();
  });
});
