import { act, fireEvent, render, screen } from "@testing-library/react";
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
    </WizardDialog>
  );
}

function renderSwitch(activeKey: string) {
  const view = render(
    <WizardDialogSwitch
      activeKey={activeKey}
      order={order}
      renderPane={(key) => <Pane paneKey={key as "first" | "second"} />}
    />,
  );
  return (next: string) =>
    view.rerender(
      <WizardDialogSwitch
        activeKey={next}
        order={order}
        renderPane={(key) => <Pane paneKey={key as "first" | "second"} />}
      />,
    );
}

function mockAnimate() {
  const finishes: Array<() => void> = [];
  const animate = vi.fn(() => {
    let finish = () => {};
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    finishes.push(finish);
    return { finished };
  });
  Object.assign(HTMLElement.prototype, { animate });
  return { animate, finishAll: () => finishes.forEach((finish) => finish()) };
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

  it("不支持动画时直接换成新面板", async () => {
    const rerender = renderSwitch("second");
    rerender("first");
    await act(async () => {});
    expect(screen.queryByText("second 内容")).not.toBeInTheDocument();
    expect(screen.getByText("first 内容")).toBeInTheDocument();
  });
});
