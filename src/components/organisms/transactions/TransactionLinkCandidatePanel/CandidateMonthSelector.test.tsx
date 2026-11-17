import { useState } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CandidateMonthSelector } from "./CandidateMonthSelector";
import {
  changeCandidateMonth,
  currentTokyoCandidateMonth,
} from "./candidateMonth";

import {
  BackLayerScope,
  useBackLayer,
} from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import { createUnsavedChangesCoordinator } from "providers/UnsavedChangesGuardProvider/unsavedChangesCoordinator";
import { createGuardHistoryPort } from "test/guardHistory";

const guardContext = vi.hoisted(() => ({
  coordinator: null as ReturnType<
    typeof createUnsavedChangesCoordinator
  > | null,
}));
vi.mock(
  "providers/UnsavedChangesGuardProvider/UnsavedChangesGuardProvider",
  () => ({
    useOptionalUnsavedChangesCoordinator: () => guardContext.coordinator,
  }),
);

function DrawerHarness({ onClose }: { onClose: () => void }) {
  useBackLayer(true, onClose);
  return <MonthHarness initialMonth="2026-11" />;
}

function MonthHarness({
  initialMonth,
  searching = false,
}: {
  initialMonth: string | null;
  searching?: boolean;
}) {
  const [month, setMonth] = useState(initialMonth);
  return (
    <CandidateMonthSelector
      month={month}
      searching={searching}
      onChange={setMonth}
    />
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  guardContext.coordinator = null;
});

describe("CandidateMonthSelector", () => {
  it("返回只关闭年月滚轮，保留外层抽屉和原月份", async () => {
    const browser = createGuardHistoryPort();
    const coordinator = createUnsavedChangesCoordinator(
      browser.port,
      "候选月份测试",
    );
    guardContext.coordinator = coordinator;
    browser.onPop(() =>
      coordinator.handlePopState(new PopStateEvent("popstate")),
    );
    const closeDrawer = vi.fn();
    render(
      <BackLayerScope level={1}>
        <DrawerHarness onClose={closeDrawer} />
      </BackLayerScope>,
    );
    fireEvent.click(screen.getByRole("button", { name: "选择月份" }));
    fireEvent.click(screen.getByRole("button", { name: "选择 8 月" }));
    await act(async () => {
      await browser.flush();
    });
    await act(async () => {
      browser.port.go(-1);
      await browser.flush();
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(closeDrawer).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "选择月份" })).toHaveTextContent(
      "2026年11月",
    );
    await act(async () => {
      browser.port.go(-1);
      await browser.flush();
    });
    expect(closeDrawer).toHaveBeenCalledOnce();
  });

  it("打开动画完成后选中的年月位于滚轮可视中心", async () => {
    render(<MonthHarness initialMonth="2026-11" />);
    fireEvent.click(screen.getByRole("button", { name: "选择月份" }));
    const selected = [
      screen.getByRole("button", { name: "选择 2026 年" }),
      screen.getByRole("button", { name: "选择 11 月" }),
    ];
    // jsdom 没有布局；在动画完成前提供滚轮尺寸，验证进入后才定位。
    for (const option of selected) {
      Object.defineProperties(option, {
        offsetTop: { configurable: true, value: 500 },
        offsetHeight: { configurable: true, value: 40 },
      });
      Object.defineProperty(option.parentElement!, "clientHeight", {
        configurable: true,
        value: 200,
      });
    }
    await waitFor(() => {
      for (const option of selected) {
        const column = option.parentElement!;
        expect(column.scrollTop + column.clientHeight / 2).toBe(
          option.offsetTop + option.offsetHeight / 2,
        );
      }
    });
  });

  it("默认月份的下一月箭头不可点击，上一月可切换", () => {
    const thisMonth = currentTokyoCandidateMonth();
    render(<MonthHarness initialMonth={thisMonth} />);
    expect(screen.getByRole("button", { name: "下个月" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "上个月" }));
    const previousMonth = changeCandidateMonth(thisMonth, -1);
    expect(screen.getByRole("button", { name: "选择月份" })).toHaveTextContent(
      `${Number(previousMonth.slice(0, 4))}年${Number(previousMonth.slice(5))}月`,
    );
    expect(screen.getByRole("button", { name: "下个月" })).not.toBeDisabled();
  });

  it("选当前年时自动把尚未到来的月份收敛为本月", async () => {
    const current = currentTokyoCandidateMonth();
    const thisYear = Number(current.slice(0, 4));
    render(<MonthHarness initialMonth={`${thisYear - 1}-12`} />);
    fireEvent.click(screen.getByRole("button", { name: "选择月份" }));
    fireEvent.click(
      screen.getByRole("button", { name: `选择 ${thisYear} 年` }),
    );
    fireEvent.click(screen.getByRole("button", { name: "确定年月" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "选择月份" })).toHaveTextContent(
      `${thisYear}年${Number(current.slice(5))}月`,
    );
  });

  it("滚轮禁用当年未来月份且确认时保持有效月份", async () => {
    const current = currentTokyoCandidateMonth();
    const monthNumber = Number(current.slice(5));
    if (monthNumber === 12) return;
    render(<MonthHarness initialMonth={current} />);
    fireEvent.click(screen.getByRole("button", { name: "选择月份" }));
    const future = screen.getByRole("button", {
      name: `选择 ${monthNumber + 1} 月`,
    });
    expect(future).toBeDisabled();
    fireEvent.click(future);
    fireEvent.click(screen.getByRole("button", { name: "确定年月" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "选择月份" })).toHaveTextContent(
      `${Number(current.slice(0, 4))}年${monthNumber}月`,
    );
  });

  it("滚轮只有确定后才应用新月份，关闭相当于取消", async () => {
    render(<MonthHarness initialMonth="2026-09" />);
    fireEvent.click(screen.getByRole("button", { name: "选择月份" }));
    expect(screen.queryByText("全部月份")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "选择 8 月" }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "选择月份" })).toHaveTextContent(
      "2026年9月",
    );
    fireEvent.click(screen.getByRole("button", { name: "选择月份" }));
    fireEvent.click(screen.getByRole("button", { name: "选择 8 月" }));
    fireEvent.click(screen.getByRole("button", { name: "确定年月" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "选择月份" })).toHaveTextContent(
      "2026年8月",
    );
  });

  it("搜索全部月份打开滚轮后直接确定仍保持全部月份", async () => {
    render(<MonthHarness searching initialMonth={null} />);
    fireEvent.click(screen.getByRole("button", { name: "选择月份" }));
    expect(screen.getByRole("button", { name: "全部月份" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "确定年月" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "选择月份" })).toHaveTextContent(
      "全部月份",
    );
  });

  it("搜索全部月份时隐藏箭头且滚轮增加全部月份选项", async () => {
    render(<MonthHarness searching initialMonth={null} />);
    expect(screen.getByRole("button", { name: "选择月份" })).toHaveTextContent(
      "全部月份",
    );
    expect(
      screen.queryByRole("button", { name: "上个月" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "下个月" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "选择月份" }));
    expect(
      screen.getByRole("button", { name: "全部月份" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "选择 8 月" }));
    fireEvent.click(screen.getByRole("button", { name: "确定年月" }));
    const clearMonth = await screen.findByRole("button", {
      name: "搜索全部月份",
    });
    fireEvent.click(clearMonth);
    expect(screen.getByRole("button", { name: "选择月份" })).toHaveTextContent(
      "全部月份",
    );
  });
});
