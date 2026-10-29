import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { WizardDialog } from "./WizardDialog";

const media = vi.hoisted(() => ({ fullScreen: false }));
vi.mock("@mui/material/useMediaQuery", () => ({
  default: () => media.fullScreen,
}));

function renderDialog(
  props: Partial<ComponentProps<typeof WizardDialog>> = {},
) {
  const onClose = vi.fn();
  render(
    <WizardDialog
      closeLabel="关闭"
      onClose={onClose}
      open
      title="预设选择"
      {...props}
    >
      <p>列表内容</p>
    </WizardDialog>,
  );
  return onClose;
}

describe("WizardDialog", () => {
  it.each([true, false])("移动端全屏，桌面端常规弹框：%s", (fullScreen) => {
    media.fullScreen = fullScreen;
    renderDialog();
    const dialog = screen.getByRole("dialog", { name: "预设选择" });
    expect(dialog.classList.contains("MuiDialog-paperFullScreen")).toBe(
      fullScreen,
    );
    expect(
      screen.getByRole("heading", { name: "预设选择" }),
    ).toBeInTheDocument();
  });
  it("点击关闭或按 Escape 都调用关闭处理", () => {
    const onClose = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
  it("锁定期间禁用关闭按钮，并拦截 Escape 与遮罩关闭", () => {
    const onClose = renderDialog({ disabled: true });
    const button = screen.getByRole("button", { name: "关闭" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    const backdrop = document.querySelector(".MuiDialog-container");
    expect(backdrop).not.toBeNull();
    fireEvent.mouseDown(backdrop!);
    fireEvent.click(backdrop!);
    expect(onClose).not.toHaveBeenCalled();
  });
  it("传入返回时左上角为返回、关闭移到右上角，不显示标题操作", () => {
    const onBack = vi.fn();
    const onClose = vi.fn();
    render(
      <WizardDialog
        back={{ label: "返回", onClick: onBack }}
        closeLabel="关闭"
        onClose={onClose}
        open
        title="小票"
        titleAction={<button type="button">切换</button>}
      >
        <p>内容</p>
      </WizardDialog>,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "返回",
      "关闭",
    ]);
    fireEvent.click(buttons[0]!);
    expect(onBack).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(buttons[1]!);
    expect(onClose).toHaveBeenCalledOnce();
  });
  it.each([
    [true, "0ms"],
    [false, "225ms"],
  ])(
    "disableEnterTransition 为 %s 时打开的淡入时长为 %s",
    (disable, duration) => {
      renderDialog({ disableEnterTransition: disable });
      const container = screen.getByRole("dialog").parentElement!;
      expect(container.style.transition).toContain(`opacity ${duration}`);
    },
  );
});
