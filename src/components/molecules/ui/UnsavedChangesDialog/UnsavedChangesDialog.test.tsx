import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UnsavedChangesDialog } from "./UnsavedChangesDialog";

afterEach(() => {
  cleanup();
});

describe("UnsavedChangesDialog", () => {
  it("关闭后返回触发元素的焦点，但不把长页滚回触发元素", async () => {
    render(<button>原触发按钮</button>);
    const trigger = screen.getByRole("button", { name: "原触发按钮" });
    trigger.focus();
    const focus = vi.spyOn(trigger, "focus");
    const props = { onCancel: vi.fn(), onDiscard: vi.fn(), onSave: vi.fn() };
    const view = render(<UnsavedChangesDialog {...props} open />);
    view.rerender(<UnsavedChangesDialog {...props} open={false} />);
    await waitFor(() =>
      expect(focus).toHaveBeenCalledWith({ preventScroll: true }),
    );
    focus.mockRestore();
  });
  it("显示未保存提示和操作按钮", () => {
    render(
      <UnsavedChangesDialog
        onCancel={vi.fn()}
        onDiscard={vi.fn()}
        onSave={vi.fn()}
        open
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("尚未保存")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "继续编辑" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "放弃修改" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
  });

  it("点击操作按钮时分别触发回调", () => {
    const onCancel = vi.fn();
    const onDiscard = vi.fn();
    const onSave = vi.fn();
    render(
      <UnsavedChangesDialog
        onCancel={onCancel}
        onDiscard={onDiscard}
        onSave={onSave}
        open
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "继续编辑" }));
    fireEvent.click(screen.getByRole("button", { name: "放弃修改" }));
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onDiscard).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledOnce();
  });
});
