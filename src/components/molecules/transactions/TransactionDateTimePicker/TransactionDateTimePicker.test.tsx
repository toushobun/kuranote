import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TransactionDateTimePicker } from "./TransactionDateTimePicker";

describe("TransactionDateTimePicker", () => {
  it("显示日期时间并在抽屉中选择日期", async () => {
    const onDateChange = vi.fn();
    render(
      <TransactionDateTimePicker
        date="2026-07-20"
        onDateChange={onDateChange}
        onTimeChange={vi.fn()}
        time="10:30:00"
      />,
    );

    expect(screen.getByText("2026年07月20日 10:30:00")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "选择记账时间" }));

    expect(
      await screen.findByRole("grid", { name: "记账日期" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "选择时刻" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    fireEvent.click(screen.getByRole("button", { name: "2026年7月15日" }));
    expect(onDateChange).toHaveBeenCalledWith("2026-07-15");
  });

  it("日期模式不显示时间选择行", async () => {
    render(
      <TransactionDateTimePicker
        date="2026-07-20"
        fieldLabel="记账日期"
        onDateChange={vi.fn()}
        openPickerLabel="选择记账日期"
        showTime={false}
      />,
    );

    expect(screen.getByText("2026年07月20日")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "选择记账日期" }));

    await screen.findByRole("grid", { name: "记账日期" });
    expect(screen.queryByRole("button", { name: "选择时刻" })).toBeNull();
  });

  it("完成按钮关闭抽屉", async () => {
    render(
      <TransactionDateTimePicker
        date="2026-07-20"
        onDateChange={vi.fn()}
        time="10:30:00"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "选择记账时间" }));
    fireEvent.click(await screen.findByRole("button", { name: "完成" }));

    await waitFor(() =>
      expect(screen.queryByRole("grid", { name: "记账日期" })).toBeNull(),
    );
  });
});
