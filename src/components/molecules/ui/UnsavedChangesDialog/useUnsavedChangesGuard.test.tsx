import { setupGuardHistoryMock } from "test/mockGuardHistory";
setupGuardHistoryMock();

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { BackLayerScope } from "./BackLayerScope";
import { TransactionBottomEditorDrawer } from "molecules/transactions/TransactionBottomEditorDrawer/TransactionBottomEditorDrawer";
import { expectInBodyPortal } from "test/bodyPortal";
import { useActionState, useState } from "react";
import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import { unsavedChangesMessages } from "config/unsavedChangesMessages";
import type { ActionState } from "types/actions";
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
      <button
        onClick={() =>
          guard.requestNavigate(() =>
            routerMock.replace("/transactions/new?method=transfer"),
          )
        }
      >
        切换方式
      </button>
      <a href="/accounts">取消</a>
      <a href="/dashboard">底部导航</a>
      <a href="/dashboard" target="_blank">
        新标签
      </a>
      <UnsavedChangesDialog {...guard.dialogProps} />
    </>
  );
}

function LayerHarness({
  enabled = true,
  dirty = false,
}: {
  enabled?: boolean;
  dirty?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const page = useUnsavedChangesGuard({
    isDirty: dirty,
    saveFormId: "background-form",
  });
  return (
    <>
      <p>底层页面</p>
      <BackLayerScope level={enabled ? 1 : null}>
        <TransactionBottomEditorDrawer
          open={open}
          title="选择商家"
          onClose={() => setOpen(false)}
        >
          <button onClick={() => setOpen(false)}>选中商家</button>
          <a href="/dashboard">抽屉内站内链接</a>
        </TransactionBottomEditorDrawer>
      </BackLayerScope>
      <UnsavedChangesDialog {...page.dialogProps} />
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
    fireEvent.click(screen.getByRole("button", { name: "保存并退出" }));
    expect(save).toHaveBeenCalledOnce();
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
  });

  it("无修改不保护刷新；修饰键、新标签不触发离开确认", async () => {
    render(<Harness />, { wrapper: ConfirmDialogTestProviders });
    fireEvent.click(screen.getByText("新标签"));
    fireEvent.click(screen.getByText("取消"), { ctrlKey: true });
    expect(screen.queryByRole("dialog")).toBeNull();
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(false);
  });
  it("动过就算修改：改回初始值后仍保护刷新和离开", async () => {
    setup();
    fireEvent.change(screen.getByLabelText("内容"), { target: { value: "" } });
    await act(async () => {
      await Promise.resolve();
    });
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
    fireEvent.click(screen.getByText("取消"));
    expect(screen.getByRole("dialog", { name: "尚未保存" })).toBeVisible();
  });
  it.each(["关闭", "遮罩", "选中"])(
    "UI %s最后一层后回基准，内部 popstate 不离开底层，前进不复活弹层",
    async (method) => {
      const { container } = render(<LayerHarness />, {
        wrapper: ConfirmDialogTestProviders,
      });
      const drawerTitle = screen.getByRole("heading", { name: "选择商家" });
      expectInBodyPortal(drawerTitle, ".MuiDrawer-root", container);
      await waitFor(() =>
        expect(window.history.state?.kuranoteUnsavedChanges?.position).toBe(
          "sentinel",
        ),
      );
      if (method === "关闭")
        fireEvent.click(
          screen.getByRole("button", { name: "关闭选择商家编辑" }),
        );
      if (method === "选中")
        fireEvent.click(screen.getByRole("button", { name: "选中商家" }));
      if (method === "遮罩")
        fireEvent.click(document.querySelector(".MuiBackdrop-root")!);
      await waitFor(() =>
        expect(window.history.state?.kuranoteUnsavedChanges?.position).toBe(
          "base",
        ),
      );
      await waitFor(() =>
        expect(screen.queryByRole("heading", { name: "选择商家" })).toBeNull(),
      );
      await act(async () => window.history.forward());
      expect(window.history.state?.kuranoteUnsavedChanges?.position).toBe(
        "base",
      );
      expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
      expect(screen.getByText("底层页面")).toBeInTheDocument();
      expect(window.history.pushState).toHaveBeenCalledOnce();
    },
  );
  it("编辑页未启用作用域时共享抽屉不登记哨兵", async () => {
    render(<LayerHarness enabled={false} />, {
      wrapper: ConfirmDialogTestProviders,
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(window.history.pushState).not.toHaveBeenCalled();
  });
  it("上方纯取消抽屉里的链接仍由底层 dirty 守卫确认并清理哨兵", async () => {
    routerMock.push.mockClear();
    render(<LayerHarness dirty />, { wrapper: ConfirmDialogTestProviders });
    fireEvent.click(screen.getByRole("link", { name: "抽屉内站内链接" }));
    expect(
      screen.getByRole("dialog", { name: "尚未保存" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "继续编辑" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull(),
    );
    fireEvent.click(screen.getByRole("link", { name: "抽屉内站内链接" }));
    fireEvent.click(screen.getByRole("button", { name: "放弃修改" }));
    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledExactlyOnceWith("/dashboard"),
    );
    expect(window.history.state?.kuranoteUnsavedChanges?.position).toBe("base");
  });
  it("程序导航也先确认，取消不导航，放弃只执行一次路由替换", async () => {
    routerMock.replace.mockClear();
    setup();
    fireEvent.click(screen.getByRole("button", { name: "切换方式" }));
    fireEvent.click(screen.getByRole("button", { name: "继续编辑" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull(),
    );
    expect(routerMock.replace).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "切换方式" }));
    fireEvent.click(screen.getByRole("button", { name: "放弃修改" }));
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledOnce());
    expect(routerMock.replace).toHaveBeenCalledWith(
      "/transactions/new?method=transfer",
    );
    expect(window.history.pushState).toHaveBeenCalledOnce();
  });
});

function SaveHarness({ result }: { result: ActionState }) {
  const guard = useUnsavedChangesGuard({
    isDirty: true,
    saveFormId: "save-test",
  });
  const [state, submit] = useActionState(
    (_previous: ActionState, data: FormData) =>
      guard.runSaveAction(data, async () => result),
    {},
  );
  return (
    <>
      <form id="save-test" action={submit}>
        <button>直接保存</button>
      </form>
      {state.success && <p role="status">{state.success}</p>}
      {state.error && <p role="alert">{state.error}</p>}
      <a href="/dashboard">前往目的地</a>
      <UnsavedChangesDialog {...guard.dialogProps} />
    </>
  );
}

describe("useUnsavedChangesGuard 保存反馈", () => {
  const success = { success: "记录已更新" };
  function setupSave(result: ActionState, viaGuard: boolean) {
    routerMock.push.mockClear();
    const view = render(<SaveHarness result={result} />, {
      wrapper: ConfirmDialogTestProviders,
    });
    if (viaGuard)
      fireEvent.click(screen.getByRole("link", { name: "前往目的地" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: viaGuard ? unsavedChangesMessages.saveAndExit : "直接保存",
      }),
    );
    return view;
  }

  it("保存并退出只在目的地提示一次，关闭后重新进入也不重播", async () => {
    const { rerender } = setupSave(success, true);
    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledExactlyOnceWith("/dashboard"),
    );
    expect(screen.queryByRole("status")).toBeNull();
    rerender(<h1>目的地</h1>);
    const feedback = await screen.findByRole("status");
    expect(feedback).toHaveTextContent(unsavedChangesMessages.saveSuccess);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    rerender(<SaveHarness result={success} />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("直接保存仍显示表单自己的成功反馈", async () => {
    setupSave(success, false);
    expect(await screen.findByRole("status")).toHaveTextContent(
      success.success,
    );
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it("保存并退出失败时保留原表单并只显示错误", async () => {
    setupSave({ error: "记录保存失败" }, true);
    expect(await screen.findByRole("alert")).toHaveTextContent("记录保存失败");
    expect(screen.queryByRole("status")).toBeNull();
    expect(routerMock.push).not.toHaveBeenCalled();
  });
});

function AsyncLeaveHarness({
  onSave,
  onClose,
}: {
  onSave: () => Promise<boolean>;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const guard = useUnsavedChangesGuard({
    isDirty: value !== "",
    saveFormId: null,
    confirmOnLeave: true,
    onClose,
    saveOnLeave: onSave,
    cleanDescription: "账本还没创建完，要保存当前进度再退出吗？",
  });
  return (
    <>
      <input
        aria-label="草稿"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button onClick={guard.requestClose}>关闭向导</button>
      <UnsavedChangesDialog {...guard.dialogProps} />
    </>
  );
}

describe("useUnsavedChangesGuard 显式退出", () => {
  it("无修改仍提示，保存成功后才关闭", async () => {
    const onSave = vi.fn(async () => true);
    const onClose = vi.fn();
    render(<AsyncLeaveHarness onSave={onSave} onClose={onClose} />, {
      wrapper: ConfirmDialogTestProviders,
    });
    fireEvent.click(screen.getByRole("button", { name: "关闭向导" }));
    expect(
      screen.getByText("账本还没创建完，要保存当前进度再退出吗？"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "保存并退出" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "保存并退出" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  it("保存失败仍留在原处，可再次保存", async () => {
    let succeed = false;
    const onSave = vi.fn(async () => succeed);
    const onClose = vi.fn();
    render(<AsyncLeaveHarness onSave={onSave} onClose={onClose} />, {
      wrapper: ConfirmDialogTestProviders,
    });
    fireEvent.change(screen.getByLabelText("草稿"), {
      target: { value: "跨步内容" },
    });
    fireEvent.click(screen.getByRole("button", { name: "关闭向导" }));
    fireEvent.click(screen.getByRole("button", { name: "保存并退出" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText("草稿")).toHaveValue("跨步内容");
    succeed = true;
    const close = await screen.findByRole("button", { name: "关闭向导" });
    await waitFor(() => expect(close).toBeVisible());
    fireEvent.click(close);
    fireEvent.click(screen.getByRole("button", { name: "保存并退出" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  it("放弃直接离开且不调用保存", async () => {
    const onSave = vi.fn(async () => true);
    const onClose = vi.fn();
    render(<AsyncLeaveHarness onSave={onSave} onClose={onClose} />, {
      wrapper: ConfirmDialogTestProviders,
    });
    fireEvent.click(screen.getByRole("button", { name: "关闭向导" }));
    fireEvent.click(screen.getByRole("button", { name: "放弃修改" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(onSave).not.toHaveBeenCalled();
  });
});

function InPlaceSaveHarness() {
  const [value, setValue] = useState("");
  const [baseline, setBaseline] = useState("");
  const guard = useUnsavedChangesGuard({
    isDirty: value !== baseline,
    saveFormId: "in-place-form",
  });
  return (
    <>
      <input
        aria-label="内容"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button
        onClick={() =>
          void guard.runSaveAction(new FormData(), async () => {
            setBaseline(value);
            return { success: "已保存" };
          })
        }
      >
        保存
      </button>
    </>
  );
}

describe("useUnsavedChangesGuard 动过的状态", () => {
  function unloadPrevented() {
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    return unload.defaultPrevented;
  }

  it("原地保存成功后清除，之后再动又算修改", async () => {
    render(<InPlaceSaveHarness />, { wrapper: ConfirmDialogTestProviders });
    const input = screen.getByLabelText("内容");
    fireEvent.change(input, { target: { value: "修改" } });
    fireEvent.change(input, { target: { value: "" } });
    await act(async () => {});
    expect(unloadPrevented()).toBe(true);
    fireEvent.change(input, { target: { value: "保存的值" } });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => expect(unloadPrevented()).toBe(false));
    // 等保存后的基线同步提交完毕。
    await act(async () => {});
    fireEvent.change(input, { target: { value: "又改了" } });
    fireEvent.change(input, { target: { value: "保存的值" } });
    await act(async () => {});
    expect(unloadPrevented()).toBe(true);
  });
});
