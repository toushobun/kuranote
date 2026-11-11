import Dialog from "@mui/material/Dialog";
import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  renderEntryComponent,
  clickEntryButton,
} from "test/transactionStepFlow";
import { TransactionBottomEditorDrawer } from "./TransactionBottomEditorDrawer";

describe("TransactionBottomEditorDrawer", () => {
  it("上层弹层打开时隐藏抽屉并保留输入，恢复后原值不丢失", () => {
    const content = (suspended: boolean) => (
      <TransactionBottomEditorDrawer
        open
        suspended={suspended}
        title="备注"
        onClose={() => {}}
      >
        <textarea aria-label="编辑备注" />
      </TransactionBottomEditorDrawer>
    );
    const { rerender } = renderEntryComponent(content(false));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "未保存备注" },
    });
    rerender(content(true));
    expect(screen.queryByRole("textbox")).toBeNull();
    rerender(content(false));
    expect(screen.getByRole("textbox")).toHaveValue("未保存备注");
  });
  it("抽屉在退出动画完成的同一轮恢复后，关闭时恢复底层弹框的无障碍访问", () => {
    vi.useFakeTimers();
    const content = (open: boolean, suspended = false) => (
      <>
        <Dialog open data-testid="receipt-modal">
          <button>添加付款账户</button>
        </Dialog>
        <TransactionBottomEditorDrawer
          open={open}
          suspended={suspended}
          title="商家"
          onClose={() => {}}
        >
          商家列表
        </TransactionBottomEditorDrawer>
        {suspended && (
          <Dialog open>
            <span>从预设添加商家</span>
          </Dialog>
        )}
      </>
    );
    try {
      const { rerender } = renderEntryComponent(content(true));
      const receiptModal = screen.getByTestId("receipt-modal");
      rerender(content(true, true));
      // 让旧的退出动画结束与抽屉恢复合并到同一次提交。
      act(() => {
        vi.runOnlyPendingTimers();
        rerender(content(true));
      });
      expect(screen.getByRole("heading", { name: "商家" })).toBeVisible();
      rerender(content(false));
      act(() => vi.runOnlyPendingTimers());
      expect(receiptModal).not.toHaveAttribute("aria-hidden", "true");
      expect(
        screen.getByRole("button", { name: "添加付款账户" }),
      ).toBeVisible();
    } finally {
      vi.useRealTimers();
    }
  });
  it.each(["完成", "关闭备注编辑"])("通过%s结束编辑", (button) => {
    const close = vi.fn();
    renderEntryComponent(
      <TransactionBottomEditorDrawer open title="备注" onClose={close}>
        <textarea aria-label="编辑备注" />
      </TransactionBottomEditorDrawer>,
    );
    expect(screen.getByRole("heading", { name: "备注" })).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "编辑备注" }),
    ).toBeInTheDocument();
    clickEntryButton(button);
    expect(close).toHaveBeenCalledOnce();
  });
});
