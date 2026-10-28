import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  renderEntryComponent,
  clickEntryButton,
} from "test/transactionStepFlow";
import { TransactionBottomEditorDrawer } from "./TransactionBottomEditorDrawer";

describe("TransactionBottomEditorDrawer", () => {
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
