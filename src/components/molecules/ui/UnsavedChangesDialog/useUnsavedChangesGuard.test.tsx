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
    saveLabel: "保存并退出",
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
