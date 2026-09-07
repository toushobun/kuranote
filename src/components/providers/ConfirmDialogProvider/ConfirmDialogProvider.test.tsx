import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import {
  ConfirmDialogProvider,
  useConfirmDialog,
} from "./ConfirmDialogProvider";

afterEach(() => {
  cleanup();
});

function ConfirmDialogTrigger() {
  const confirm = useConfirmDialog();
  const [result, setResult] = useState<boolean | null>(null);

  async function openConfirm() {
    setResult(
      await confirm({
        confirmLabel: "继续",
        description: "确认后会继续处理。",
        title: "继续这个操作？",
      }),
    );
  }

  return (
    <>
      <button onClick={openConfirm} type="button">
        打开确认
      </button>
      <output data-testid="result">
        {result === null ? "pending" : String(result)}
      </output>
    </>
  );
}

function renderProvider() {
  return render(
    <ConfirmDialogProvider>
      <ConfirmDialogTrigger />
    </ConfirmDialogProvider>,
  );
}

describe("ConfirmDialogProvider", () => {
  it("调用 confirm 后显示传入的标题和说明", () => {
    renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "打开确认" }));

    expect(
      screen.getByRole("heading", { name: "继续这个操作？" }),
    ).toBeInTheDocument();
    expect(screen.getByText("确认后会继续处理。")).toBeInTheDocument();
  });

  it("确认后返回 true 并关闭弹窗", async () => {
    renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "打开确认" }));
    fireEvent.click(screen.getByRole("button", { name: "继续" }));

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent("true");
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("取消后返回 false 并关闭弹窗", async () => {
    renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "打开确认" }));
    fireEvent.click(screen.getByRole("button", { name: "取消" }));

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent("false");
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("点击弹窗外关闭时返回 false 并关闭弹窗", async () => {
    renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "打开确认" }));
    const dialogContainer = screen.getByRole("dialog").parentElement;

    expect(dialogContainer).not.toBeNull();
    fireEvent.mouseDown(dialogContainer!);
    fireEvent.click(dialogContainer!);

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent("false");
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
