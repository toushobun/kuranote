import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UnsavedChangesDialog } from "./UnsavedChangesDialog";

afterEach(() => {
  cleanup();
});

describe("UnsavedChangesDialog", () => {
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
