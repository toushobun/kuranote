import { setupGuardHistoryMock } from "test/mockGuardHistory";
setupGuardHistoryMock();

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import { describe, expect, it, vi } from "vitest";

import { routerMock } from "test/mocks/navigation";

import { UnsavedChangesDialog } from "./UnsavedChangesDialog";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";

vi.mock("next/navigation", () => import("test/mocks/navigation"));

function Harness({ save = () => {} }: { save?: () => void }) {
  const [value, setValue] = useState("");
  const guard = useUnsavedChangesGuard({
    isDirty: value !== "",
    saveFormId: "guard-test-form",
  });
  return (
    <>
      <form
        id="guard-test-form"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <input
          aria-label="内容"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </form>
      <a href="/accounts">取消</a>
      <a href="/dashboard">底部导航</a>
      <a href="/dashboard" target="_blank">
        新标签
      </a>
      <UnsavedChangesDialog {...guard.dialogProps} />
    </>
  );
}

function setup(save?: () => void) {
  routerMock.push.mockClear();
  const view = render(<Harness save={save} />, {
    wrapper: ConfirmDialogTestProviders,
  });
  fireEvent.change(screen.getByLabelText("内容"), {
    target: { value: "修改" },
  });
  return view;
}

describe("useUnsavedChangesGuard", () => {
  it.each(["取消", "底部导航"])("拦截%s，继续编辑保留输入", async (name) => {
    setup();
    fireEvent.click(screen.getByText(name));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "继续编辑" }));
    expect(screen.getByLabelText("内容")).toHaveValue("修改");
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it("放弃只执行原目标导航一次", async () => {
    setup();
    fireEvent.click(screen.getByText("底部导航"));
    fireEvent.click(screen.getByRole("button", { name: "放弃修改" }));
    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledExactlyOnceWith("/dashboard"),
    );
  });

  it("确认里的保存交还表单校验，未保存状态仍保护刷新", async () => {
    const save = vi.fn();
    setup(save);
    fireEvent.click(screen.getByText("取消"));
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(save).toHaveBeenCalledOnce();
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
  });

  it("无修改或改回初始值不保护刷新；修饰键、新标签不触发离开确认", async () => {
    setup();
    fireEvent.click(screen.getByText("新标签"));
    fireEvent.click(screen.getByText("取消"), { ctrlKey: true });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.change(screen.getByLabelText("内容"), { target: { value: "" } });
    await act(async () => {
      await Promise.resolve();
    });
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(false);
  });
});
