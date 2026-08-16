import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LedgerSpecialStatusSetting } from "./LedgerSpecialStatusSetting";

describe("LedgerSpecialStatusSetting", () => {
  it("允许管理员启停功能并预览固定状态", () => {
    const onChange = vi.fn();
    render(
      <LedgerSpecialStatusSetting enabled onChange={onChange} state="ready" />,
    );

    expect(screen.getByText("待报销")).toBeInTheDocument();
    expect(screen.getByText("已结清")).toBeInTheDocument();
    expect(screen.getByText("待退款")).toBeInTheDocument();
    expect(screen.getByText("已退款")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: "启用特殊状态" }));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("普通成员只能查看设置", () => {
    render(
      <LedgerSpecialStatusSetting
        canEdit={false}
        enabled={false}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("switch", { name: "启用特殊状态" })).toBeDisabled();
    expect(screen.getByText(/只有管理员或所有者/)).toBeInTheDocument();
  });

  it("关闭状态说明存在特殊状态明细时需要先处理", () => {
    render(<LedgerSpecialStatusSetting enabled={false} onChange={vi.fn()} />);

    expect(
      screen.getByText(
        "如果账本内还有待报销或已报销的明细，将无法关闭；请先处理完这些明细。",
      ),
    ).toBeInTheDocument();
  });

  it("错误时显示反馈并允许重试", () => {
    const onRetry = vi.fn();
    render(
      <LedgerSpecialStatusSetting
        enabled={false}
        onChange={vi.fn()}
        onRetry={onRetry}
        state="error"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
