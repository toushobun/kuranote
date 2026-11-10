import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WizardDialog } from "./WizardDialog";
import { WizardDialogSwitch } from "./WizardDialogSwitch";

const order = ["first", "second"];
const closes = { first: vi.fn(), second: vi.fn() };

function Pane({ paneKey }: { paneKey: "first" | "second" }) {
  return (
    <WizardDialog
      open
      closeLabel="关闭"
      title={`${paneKey} 标题`}
      onClose={closes[paneKey]}
    >
      <p>{paneKey} 内容</p>
      <PaneDraft paneKey={paneKey} />
    </WizardDialog>
  );
}

// 面板内的未保存输入，用来确认重新进入时是否是新实例。
function PaneDraft({ paneKey }: { paneKey: string }) {
  const [value, setValue] = useState("");
  return (
    <input
      aria-label={`${paneKey} 草稿`}
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

function renderSwitch(activeKey: string, keepMounted = false) {
  const view = render(
    <WizardDialogSwitch
      activeKey={activeKey}
      keepMounted={keepMounted}
      order={order}
      renderPane={(key) => <Pane paneKey={key as "first" | "second"} />}
    />,
  );
  return (next: string) =>
    view.rerender(
      <WizardDialogSwitch
        activeKey={next}
        keepMounted={keepMounted}
        order={order}
        renderPane={(key) => <Pane paneKey={key as "first" | "second"} />}
      />,
    );
}

function mockAnimate() {
  const finishes: Array<() => void> = [];
  const cancel = vi.fn();
  const animate = vi.fn(() => {
    let finish = () => {};
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    finishes.push(finish);
    return { finished, cancel };
  });
  Object.assign(HTMLElement.prototype, { animate });
  return {
    animate,
    cancel,
    finishAll: () => finishes.forEach((finish) => finish()),
  };
}

describe("WizardDialogSwitch", () => {
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, "animate");
    vi.clearAllMocks();
  });

  it("只开一个弹框，标题栏来自当前面板", () => {
    renderSwitch("first");
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(
      screen.getByRole("dialog", { name: "first 标题" }),
    ).toBeInTheDocument();
    expect(screen.getByText("first 内容")).toBeInTheDocument();
  });

  it("点关闭或按 Escape 都交给当前面板处理", () => {
    const rerender = renderSwitch("first");
    rerender("second");
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(closes.second).toHaveBeenCalledTimes(2);
    expect(closes.first).not.toHaveBeenCalled();
  });

  it("切换时旧面板滑出期间不可操作，动画结束后卸载", async () => {
    const { animate, finishAll } = mockAnimate();
    const rerender = renderSwitch("first");
    rerender("second");
    const exiting = screen.getByTestId("wizard-dialog-switch-pane-first");
    expect(exiting).toHaveAttribute("aria-hidden", "true");
    expect(exiting).toHaveAttribute("inert");
    expect(screen.getAllByRole("heading")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "second 标题" }),
    ).toBeInTheDocument();
    // 新面板从右推入（second 排在 first 之后）。
    expect(animate).toHaveBeenCalledWith(
      [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }],
      expect.anything(),
    );
    await act(async () => finishAll());
    expect(
      screen.queryByTestId("wizard-dialog-switch-pane-first"),
    ).not.toBeInTheDocument();
  });

  it("滑出中又切回时新建面板，不复活已放弃的输入，并取消上一轮动画", async () => {
    const { cancel, finishAll } = mockAnimate();
    const rerender = renderSwitch("first");
    fireEvent.change(screen.getByRole("textbox", { name: "first 草稿" }), {
      target: { value: "已放弃" },
    });
    rerender("second");
    const abandoned = screen.getByTestId("wizard-dialog-switch-pane-first");
    rerender("first");
    expect(abandoned).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "first 草稿" })).toHaveValue("");
    // 上一轮的新旧两段与标题淡入都被取消。
    expect(cancel).toHaveBeenCalledTimes(3);
    await act(async () => finishAll());
    expect(
      screen.queryByTestId("wizard-dialog-switch-pane-second"),
    ).not.toBeInTheDocument();
    expect(screen.getAllByTestId(/wizard-dialog-switch-pane-/)).toHaveLength(1);
  });

  it("常驻面板滑出后隐藏且不可聚焦，切回时保留原输入", async () => {
    const { finishAll } = mockAnimate();
    const rerender = renderSwitch("first", true);
    const draft = screen.getByRole("textbox", { name: "first 草稿" });
    fireEvent.change(draft, { target: { value: "草稿" } });
    rerender("second");
    const inactive = screen.getByTestId("wizard-dialog-switch-pane-first");
    expect(inactive).toHaveAttribute("inert");
    expect(inactive).toHaveAttribute("aria-hidden", "true");
    await act(async () => finishAll());
    expect(inactive).not.toBeVisible();
    expect(draft).toBeInTheDocument();
    rerender("first");
    expect(screen.getByRole("textbox", { name: "first 草稿" })).toBe(draft);
    expect(draft).toHaveValue("草稿");
  });

  it("面板没有标题时用 ariaLabel 给共用外框命名", () => {
    render(
      <WizardDialogSwitch
        activeKey="done"
        order={["done"]}
        renderPane={() => (
          <WizardDialog
            open
            closeLabel="关闭"
            ariaLabel="完成"
            onClose={() => {}}
          >
            <p>已完成</p>
          </WizardDialog>
        )}
      />,
    );
    expect(screen.getByRole("dialog", { name: "完成" })).toBeInTheDocument();
  });

  it("不支持动画时直接换成新面板", async () => {
    const rerender = renderSwitch("second");
    rerender("first");
    await act(async () => {});
    expect(screen.queryByText("second 内容")).not.toBeInTheDocument();
    expect(screen.getByText("first 内容")).toBeInTheDocument();
  });
});
