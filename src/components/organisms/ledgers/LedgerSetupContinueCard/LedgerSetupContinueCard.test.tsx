import {
  openLedgerSetupAbandonConfirm,
  confirmLedgerSetupAbandon,
} from "test/ledgerSetupAbandon";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import { LedgerSetupContinueCard } from "./LedgerSetupContinueCard";

describe("LedgerSetupContinueCard", () => {
  it("显示账本名、当前步骤与进度", () => {
    render(
      <LedgerSetupContinueCard
        abandonAction={async () => ({})}
        onAbandoned={vi.fn()}
        onContinue={vi.fn()}
        setup={{
          id: "00000000-0000-4000-8000-000000000001",
          name: "我们家",
          step: 3,
        }}
      />,
    );

    const card = screen.getByRole("region", { name: "「我们家」还没创建完" });
    expect(
      within(card).getByRole("heading", { name: "「我们家」还没创建完" }),
    ).toBeInTheDocument();
    expect(within(card).getByText("进行到第 3 步 · 商家")).toBeInTheDocument();
    expect(within(card).getByText("第 3 / 6 步")).toBeInTheDocument();
    // 进度按已完成步数（3 − 1）/ 6 显示。
    expect(
      within(card).getByRole("progressbar", { name: "创建进度" }),
    ).toHaveAttribute("aria-valuenow", "33");
  });

  it("点击「继续创建」调用 onContinue", () => {
    const onContinue = vi.fn();
    render(
      <LedgerSetupContinueCard
        abandonAction={async () => ({})}
        onAbandoned={vi.fn()}
        onContinue={onContinue}
        setup={{
          id: "00000000-0000-4000-8000-000000000001",
          name: "我们家",
          step: 1,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "继续创建" }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});

describe("LedgerSetupContinueCard 放弃创建", () => {
  it("首页次要操作确认成功后通知刷新", async () => {
    const action = vi.fn(async () => ({}));
    const onAbandoned = vi.fn();
    render(
      <ConfirmDialogTestProviders>
        <LedgerSetupContinueCard
          abandonAction={action}
          onAbandoned={onAbandoned}
          onContinue={vi.fn()}
          setup={{ id: "ledger", name: "我们家", step: 2 }}
        />
      </ConfirmDialogTestProviders>,
    );
    const continueButton = screen.getByRole("button", { name: "继续创建" });
    const dialog = await openLedgerSetupAbandonConfirm("我们家");
    expect(continueButton).toBeEnabled();
    confirmLedgerSetupAbandon(dialog);
    await waitFor(() => expect(onAbandoned).toHaveBeenCalledOnce());
    expect(action).toHaveBeenCalledWith({ ledgerId: "ledger" });
  });
});
