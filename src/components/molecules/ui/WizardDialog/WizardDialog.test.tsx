import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WizardDialog } from "./WizardDialog";

const media = vi.hoisted(() => ({ fullScreen: false }));
vi.mock("@mui/material/useMediaQuery", () => ({
  default: () => media.fullScreen,
}));

function renderDialog(disabled = false) {
  const onClose = vi.fn();
  render(
    <WizardDialog
      closeLabel="关闭"
      disabled={disabled}
      onClose={onClose}
      open
      title="预设选择"
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
    const onClose = renderDialog(true);
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
});
