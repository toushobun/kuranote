import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
  fireEvent.click(screen.getByRole("button", { name: "放弃创建" }));
  return { action, onSuccess };
}
describe("LedgerSetupAbandonButton", () => {
  it("显示危险确认并允许取消", async () => {
    const { action } = setup();
    const dialog = await screen.findByRole("dialog", {
      name: "放弃创建「我们家」？",
    });
    expect(
      within(dialog).getByText("已填写的内容将被删除，且无法恢复。"),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "取消" }));
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
    const dialog = await screen.findByRole("dialog", {
      name: "放弃创建「我们家」？",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "放弃创建" }));
    expect(
      await screen.findByRole("progressbar", { name: "正在放弃创建" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    await act(async () => resolve({ error: "无法放弃", errorKey: "first" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("无法放弃");
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
