import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createTheme } from "@mui/material/styles";
import { afterEach, describe, expect, it } from "vitest";

import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { amountKeypadZIndex, appZIndex } from "theme/zIndex";

import {
  amountInputCommitEvent,
  amountKeypadDrawerPaperSx,
  amountKeypadDrawerSx,
  TransactionAmountKeypadLauncher,
} from "./TransactionAmountKeypadLauncher";

function renderAmountInput(currency?: string) {
  render(
    <div>
      <input
        data-amount-currency={currency}
        data-amount-input="true"
        placeholder="0"
        type="text"
      />
      <TransactionAmountKeypadLauncher />
    </div>,
  );
}

afterEach(() => {
  cleanup();
});

describe("TransactionAmountKeypadLauncher", () => {
  it("金额输入框获得焦点后显示计算器并回填金额", async () => {
    renderAmountInput();

    const input = screen.getByRole("textbox");
    fireEvent.focusIn(input);

    expect(screen.getByLabelText("金额计算器")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "1" }));
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    fireEvent.click(screen.getByRole("button", { name: "确认" }));

    expect(input).toHaveProperty("value", "12");
    await waitFor(() => {
      expect(screen.queryByLabelText("金额计算器")).toBeNull();
    });
  });

  describe("写入与金额确定事件", () => {
    function listenInputAndCommit(input: HTMLElement) {
      const events: string[] = [];
      const readValue = () => (input as HTMLInputElement).value;
      input.addEventListener("input", () =>
        events.push(`input:${readValue()}`),
      );
      input.addEventListener(amountInputCommitEvent, () =>
        events.push(`commit:${readValue()}`),
      );
      return events;
    }

    function openAndType(input: HTMLElement, keys: string[]) {
      fireEvent.focusIn(input);
      for (const key of keys) {
        fireEvent.click(screen.getByRole("button", { name: key }));
      }
    }

    it("逐键输入时只更新计算器显示，不写入输入框", () => {
      renderAmountInput();
      const input = screen.getByRole("textbox");
      const events = listenInputAndCommit(input);

      openAndType(input, ["1", "2"]);

      expect(screen.getByLabelText("计算器显示金额").textContent).toContain(
        "12",
      );
      expect(input).toHaveProperty("value", "");
      expect(events).toEqual([]);
    });

    it("点确认时先写入一次最终金额，再派发金额确定事件", async () => {
      renderAmountInput();
      const input = screen.getByRole("textbox");
      const events = listenInputAndCommit(input);

      openAndType(input, ["1", "2", "加", "3"]);
      fireEvent.click(screen.getByRole("button", { name: "确认" }));

      expect(input).toHaveProperty("value", "15");
      expect(events).toEqual(["input:15", "commit:15"]);
      await waitFor(() => {
        expect(screen.queryByLabelText("金额计算器")).toBeNull();
      });
    });

    it("不点确认直接关闭时视为取消，不写入也不派发", async () => {
      renderAmountInput();
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "8" } });
      const events = listenInputAndCommit(input);

      openAndType(input, ["2"]);
      fireEvent.keyDown(screen.getByLabelText("金额计算器"), {
        key: "Escape",
      });

      expect(input).toHaveProperty("value", "8");
      expect(events).toEqual([]);
      await waitFor(() => {
        expect(screen.queryByLabelText("金额计算器")).toBeNull();
      });
    });

    it("取消后再次打开时从输入框当前金额开始", async () => {
      renderAmountInput();
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "8" } });

      openAndType(input, ["2"]);
      fireEvent.keyDown(screen.getByLabelText("金额计算器"), {
        key: "Escape",
      });
      await waitFor(() => {
        expect(screen.queryByLabelText("金额计算器")).toBeNull();
      });
      // 关闭后到下一帧之前会忽略 focusin，重试直到计算器重新打开。
      await waitFor(() => {
        fireEvent.focusIn(input);
        expect(screen.getByLabelText("金额计算器")).toBeInTheDocument();
      });

      expect(screen.getByLabelText("计算器显示金额").textContent).toContain(
        "8",
      );
      expect(screen.getByLabelText("计算器显示金额").textContent).not.toContain(
        "82",
      );
    });
  });

  it("会读取金额输入框上的货币信息", () => {
    renderAmountInput("USD");

    fireEvent.focusIn(screen.getByRole("textbox"));

    expect(screen.getByLabelText("计算器显示金额").textContent).toContain(
      "$ 0",
    );
  });

  it("抽屉层级高于底部导航、dialog 和 dropdown，并保持面板贴底", () => {
    expect(amountKeypadDrawerSx.zIndex).toBe(amountKeypadZIndex);
    expect(amountKeypadDrawerSx.zIndex).toBeGreaterThan(
      bottomNavigationLayout.navigationZIndex,
    );
    expect(amountKeypadDrawerSx.zIndex).toBeGreaterThan(appZIndex.dialog);
    expect(amountKeypadDrawerSx.zIndex).toBeGreaterThan(appZIndex.dropdown);
    expect(amountKeypadDrawerSx.zIndex).toBeLessThan(appZIndex.tooltip);
    expect("bottom" in amountKeypadDrawerPaperSx).toBe(false);
  });

  it("抽屉内部会用 spacing scale 为 safe-area 预留底部内边距", () => {
    const theme = createTheme();

    expect(amountKeypadDrawerPaperSx.pb(theme)).toBe(
      `calc(${theme.spacing(1.5)} + ${bottomNavigationLayout.safeAreaPaddingBottom})`,
    );
  });

  it("不会仅因 placeholder 为 0 就响应普通输入框", () => {
    render(
      <div>
        <input placeholder="0" type="text" />
        <TransactionAmountKeypadLauncher />
      </div>,
    );

    fireEvent.focusIn(screen.getByRole("textbox"));

    expect(screen.queryByLabelText("金额计算器")).toBeNull();
  });
});
