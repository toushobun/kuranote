import { useState } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CandidateMonthSelector } from "./CandidateMonthSelector";
import {
  changeCandidateMonth,
  currentTokyoCandidateMonth,
} from "./candidateMonth";

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

afterEach(() => cleanup());

describe("CandidateMonthSelector", () => {
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

  it("滚轮只有确定后才应用新月份，关闭相当于取消", async () => {
    render(<MonthHarness initialMonth="2026-09" />);
    fireEvent.click(screen.getByRole("button", { name: "选择月份" }));
    expect(screen.queryByText("全部月份")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "选择 8 月" }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "选择月份" })).toHaveTextContent(
        "2026年9月",
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "选择月份" }));
    fireEvent.click(screen.getByRole("button", { name: "选择 8 月" }));
    fireEvent.click(screen.getByRole("button", { name: "确定年月" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "选择月份" })).toHaveTextContent(
        "2026年8月",
      ),
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
    const clearMonth = await screen.findByRole("button", { name: "搜索全部月份" });
    fireEvent.click(clearMonth);
    expect(screen.getByRole("button", { name: "选择月份" })).toHaveTextContent(
      "全部月份",
    );
  });
});
