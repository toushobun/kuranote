import Dialog from "@mui/material/Dialog";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import { expectInBodyPortal } from "test/bodyPortal";
import {
  ReceiptCreationTestProviders,
  submitReceiptCreation,
} from "test/receiptCreation";
import { useReceiptCreation } from "./ReceiptCreationProvider";

function CreationLauncher() {
  const creation = useReceiptCreation();
  return (
    <Dialog fullScreen open>
      <button onClick={() => creation?.addMerchant?.(vi.fn())}>
        {m.addMerchant}
      </button>
      <button onClick={() => creation?.addAccount?.(vi.fn())}>
        {m.addAccount}
      </button>
    </Dialog>
  );
}

afterEach(cleanup);

describe("ReceiptCreationProvider", () => {
  it.each(["merchant", "account"] as const)(
    "全屏流程内新增 %s 成功后提示通过 body Portal 显示",
    async (kind) => {
      const { container } = render(<CreationLauncher />, {
        wrapper: ReceiptCreationTestProviders,
      });
      const flowDialog = screen
        .getByRole("dialog")
        .closest<HTMLElement>(".MuiDialog-root")!;
      fireEvent.click(
        screen.getByRole("button", {
          name: kind === "merchant" ? m.addMerchant : m.addAccount,
        }),
      );
      await submitReceiptCreation(kind, "测试新增");

      const feedback = screen.getByRole("status");
      expect(feedback).toHaveTextContent(
        kind === "merchant"
          ? m.merchantCreated("测试新增")
          : m.accountCreated("测试新增"),
      );
      expectInBodyPortal(feedback, ".MuiSnackbar-root", container, flowDialog);
      expect(flowDialog).toBeInTheDocument();
    },
  );
});
