import { fireEvent, screen, within } from "@testing-library/react";
import { ledgerSetupAbandonMessages as messages } from "config/ledgerSetupMessages";

/** 外层入口共用的危险确认交互，避免文案与弹框查询分散维护。 */
export async function openLedgerSetupAbandonConfirm(
  ledgerName: string,
  trigger: string = messages.abandon,
) {
  fireEvent.click(await screen.findByRole("button", { name: trigger }));
  return screen.findByRole("dialog", { name: messages.title(ledgerName) });
}

export function confirmLedgerSetupAbandon(dialog: HTMLElement) {
  fireEvent.click(
    within(dialog).getByRole("button", { name: messages.abandon }),
  );
}

/** 任意步骤主动退出都要先通过三按钮确认；此操作只丢弃本地修改。 */
export async function discardLedgerSetupWizardChanges() {
  const guard = await screen.findByRole("dialog", { name: "尚未保存" });
  fireEvent.click(within(guard).getByRole("button", { name: "放弃修改" }));
}
