import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActionButton } from "./ActionButton";

afterEach(() => vi.useRealTimers());

describe("ActionButton", () => {
  it("处理中立即禁止点击并标记 aria-busy，150ms 后才显示转圈", () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    render(
      <ActionButton pending pendingLabel="保存中…" onClick={onClick}>
        保存
      </ActionButton>,
    );
    const button = screen.getByRole("button", { name: "保存中…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("data-action-pending", "true");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(150));
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(button).toHaveAccessibleName("保存中…");
  });

  it("普通文案和处理文案在同一网格中占位，宽度不会跳变", () => {
    vi.useFakeTimers();
    render(
      <ActionButton pending pendingLabel="保存中…">
        保存
      </ActionButton>,
    );
    const grid = document.querySelector("[data-action-button-content]");
    expect(grid?.children).toHaveLength(2);
    expect(getComputedStyle(grid!).display).toBe("inline-grid");
    act(() => vi.advanceTimersByTime(150));
    expect(grid?.children).toHaveLength(2);
    expect(getComputedStyle(grid!.children[0]!).visibility).toBe("hidden");
    expect(getComputedStyle(grid!.children[1]!).visibility).toBe("visible");
  });

  it.each([false, true])(
    "无论 fullWidth=%s，加载前后均在同一网格轨道占位",
    (fullWidth) => {
      vi.useFakeTimers();
      const { container } = render(
        <ActionButton
          fullWidth={fullWidth}
          pending
          pendingLabel="保存中…"
          variant="contained"
        >
          保存
        </ActionButton>,
      );
      const button = screen.getByRole("button", { name: "保存中…" });
      expect(getComputedStyle(button).display).toBe("inline-grid");
      expect(getComputedStyle(button).gridTemplateColumns).toBe("max-content");
      const content = container.querySelector("[data-action-button-content]");
      expect(
        getComputedStyle(content!).gridArea.replaceAll(" ", ""),
      ).toBe("1/1");
      act(() => vi.advanceTimersByTime(150));
      // center 模式不额外生成 startIcon，占位由 grid 本身保证。
      expect(button).toHaveClass("MuiButton-loadingPositionCenter");
      expect(button.querySelector(".MuiButton-startIcon")).toBeNull();
      const indicator = button.querySelector(".MuiButton-loadingIndicator");
      expect(indicator).toBeInTheDocument();
      expect(
        getComputedStyle(indicator!).gridArea.replaceAll(" ", ""),
      ).toBe("1/1");
      expect(getComputedStyle(indicator!).position).toBe("relative");
      expect(getComputedStyle(indicator!).justifySelf).toBe("start");
    },
  );

  it("真的禁用与处理中不同，只有后者保留状态标记", () => {
    render(
      <ActionButton disabled pendingLabel="保存中…" variant="contained">
        保存
      </ActionButton>,
    );
    const button = screen.getByRole("button", { name: "保存" });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("Mui-disabled");
    expect(button).not.toHaveAttribute("data-action-pending");
    expect(button).not.toHaveAttribute("aria-busy");
  });

  it("链接模式在处理中或禁用时不会执行跳转与点击回调", () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    const { rerender } = render(
      <ActionButton<"a">
        component="a"
        href="#ledger"
        pending
        pendingLabel="切换中…"
        onClick={onClick}
      >
        切换
      </ActionButton>,
    );
    const link = screen.getByRole("link", { name: "切换中…" });
    expect(link).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();

    rerender(
      <ActionButton<"a">
        component="a"
        href="#ledger"
        disabled
        pendingLabel="切换中…"
        onClick={onClick}
      >
        切换
      </ActionButton>,
    );
    fireEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();

    rerender(
      <ActionButton<"a">
        component="a"
        href="#ledger"
        pendingLabel="切换中…"
        onClick={onClick}
      >
        切换
      </ActionButton>,
    );
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("主按钮、描边和红色危险按钮均支持统一处理反馈", () => {
    vi.useFakeTimers();
    render(
      <>
        <ActionButton variant="contained" pending pendingLabel="保存中…">
          保存
        </ActionButton>
        <ActionButton variant="outlined" pending pendingLabel="提交中…">
          提交
        </ActionButton>
        <ActionButton
          color="error"
          variant="outlined"
          pending
          pendingLabel="删除中…"
        >
          删除
        </ActionButton>
      </>,
    );
    act(() => vi.advanceTimersByTime(150));
    for (const name of ["保存中…", "提交中…", "删除中…"]) {
      const button = screen.getByRole("button", { name });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "true");
      expect(button).toHaveAttribute("data-action-pending", "true");
    }
    expect(screen.getByRole("button", { name: "删除中…" })).toHaveClass(
      "MuiButton-outlined",
      "MuiButton-colorError",
    );
  });
});
