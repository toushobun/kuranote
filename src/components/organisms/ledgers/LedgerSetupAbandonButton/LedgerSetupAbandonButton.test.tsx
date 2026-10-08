import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ledgerSetupAbandonMessages as messages } from "config/ledgerSetupMessages";
import {
  confirmLedgerSetupAbandon,
  openLedgerSetupAbandonConfirm,
} from "test/ledgerSetupAbandon";
import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import type { LedgerSetupAbandonAction } from "types/ledgers";
import { LedgerSetupAbandonButton } from "./LedgerSetupAbandonButton";
function setup(action: LedgerSetupAbandonAction = vi.fn(async () => ({}))) {
  const onSuccess = vi.fn();
  render(
    <ConfirmDialogTestProviders>
      <LedgerSetupAbandonButton
        action={action}
        ledgerId="ledger"
        ledgerName="我们家"
        onSuccess={onSuccess}
      />
    </ConfirmDialogTestProviders>,
  );
  return { action, onSuccess };
}
describe("LedgerSetupAbandonButton", () => {
  it("显示危险确认并允许取消", async () => {
    const { action } = setup();
    const dialog = await openLedgerSetupAbandonConfirm("我们家");
    expect(within(dialog).getByText(messages.description)).toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole("button", { name: messages.cancel }),
    );
    expect(action).not.toHaveBeenCalled();
  });
  it("提交中禁用按钮并显示进度，失败复用反馈", async () => {
    let resolve!: (state: { error: string; errorKey: string }) => void;
    const action = vi.fn(
      () =>
        new Promise<{ error: string; errorKey: string }>((done) => {
          resolve = done;
        }),
    );
    const { onSuccess } = setup(action);
    const dialog = await openLedgerSetupAbandonConfirm("我们家");
    confirmLedgerSetupAbandon(dialog);
    expect(
      await screen.findByRole("progressbar", { name: messages.pending }),
    ).toBeInTheDocument();
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    await act(async () => resolve({ error: "无法放弃", errorKey: "first" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("无法放弃");
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
