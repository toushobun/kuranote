import { fireEvent, screen } from "@testing-library/react";
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
