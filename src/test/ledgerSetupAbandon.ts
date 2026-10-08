import { fireEvent, screen, within } from "@testing-library/react";
import { ledgerSetupAbandonMessages as messages } from "config/ledgerSetupMessages";

/** 三处入口共用的危险确认交互，避免文案与弹框查询分散维护。 */
export async function openLedgerSetupAbandonConfirm(ledgerName: string) {
  fireEvent.click(screen.getByRole("button", { name: messages.abandon }));
  return screen.findByRole("dialog", { name: messages.title(ledgerName) });
}

export function confirmLedgerSetupAbandon(dialog: HTMLElement) {
  fireEvent.click(
    within(dialog).getByRole("button", { name: messages.abandon }),
  );
}
