import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SegmentTabs } from "./SegmentTabs";

afterEach(() => {
  cleanup();
});

describe("SegmentTabs", () => {
  const items = [
    { label: "日", value: "day" },
    { label: "月", value: "month" },
    { label: "年", value: "year", disabled: true },
  ] as const;

  it("显示分段切换并标记当前选中项", () => {
    render(
      <SegmentTabs
        ariaLabel="统计期间"
        items={items}
        value="month"
        onChange={() => undefined}
      />,
    );

    expect(screen.getByRole("group", { name: "统计期间" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "月" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "年" })).toBeDisabled();
  });

  it("点击未选中项时触发切换", () => {
    const onChange = vi.fn();
    render(
      <SegmentTabs
        ariaLabel="统计期间"
        items={items}
        value="month"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "日" }));

    expect(onChange).toHaveBeenCalledWith("day");
  });
});
