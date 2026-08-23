import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LinkedTransactionSyncConfirmationDialog } from "./LinkedTransactionSyncConfirmationDialog";

describe("LinkedTransactionSyncConfirmationDialog", () => {
  it("显示关联同步说明并确认同步修改", () => {
    const onConfirm = vi.fn();
    render(
      <LinkedTransactionSyncConfirmationDialog
        onCancel={vi.fn()}
        onConfirm={onConfirm}
        open
      />,
    );

    expect(
      screen.getByText(
        "该明细已有退款 / 报销绑定，是否同步修改关联数据？取消后不会写入任何修改。",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "同步修改" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("取消时只关闭弹层", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <LinkedTransactionSyncConfirmationDialog
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
