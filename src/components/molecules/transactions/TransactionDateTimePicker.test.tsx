import type { ComponentProps } from "react";

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TransactionDateTimePicker } from "./TransactionDateTimePicker";

const originalScrollEndDescriptor = Object.getOwnPropertyDescriptor(
  window,
  "onscrollend",
);

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  restoreScrollEndSupport();
});

function renderPicker(
  props: Partial<ComponentProps<typeof TransactionDateTimePicker>> = {},
) {
  const onDateChange = vi.fn();
  const onTimeChange = vi.fn();

  render(
    <TransactionDateTimePicker
      date="2026-06-20"
      onDateChange={onDateChange}
      onTimeChange={onTimeChange}
      time="13:10:33"
      {...props}
    />,
  );

  return { onDateChange, onTimeChange };
}

function scrollPickerOption(name: string) {
  const option = screen.getByRole("button", { name });
  const container = option.parentElement;

  if (!container) {
    throw new Error(`选择列容器不存在: ${name}`);
  }

  const options = Array.from(
    container.querySelectorAll<HTMLButtonElement>("[data-picker-value]"),
  );

  Object.defineProperty(container, "clientHeight", {
    configurable: true,
    value: 200,
  });

  options.forEach((pickerOption, index) => {
    Object.defineProperty(pickerOption, "offsetHeight", {
      configurable: true,
      value: 40,
    });
    Object.defineProperty(pickerOption, "offsetTop", {
      configurable: true,
      value: index * 40,
    });
  });

  const scrollTop =
    option.offsetTop + option.offsetHeight / 2 - container.clientHeight / 2;

  Object.defineProperty(container, "scrollTop", {
    configurable: true,
    value: scrollTop,
    writable: true,
  });

  fireEvent.scroll(container);

  return container;
}

function finishPickerScroll() {
  act(() => {
    vi.advanceTimersByTime(150);
  });
}

function setScrollEndSupport(supported: boolean) {
  if (!supported) {
    Reflect.deleteProperty(window, "onscrollend");
    return;
  }

  Object.defineProperty(window, "onscrollend", {
    configurable: true,
    value: null,
  });
}

function restoreScrollEndSupport() {
  if (originalScrollEndDescriptor) {
    Object.defineProperty(window, "onscrollend", originalScrollEndDescriptor);
    return;
  }

  Reflect.deleteProperty(window, "onscrollend");
}

describe("TransactionDateTimePicker", () => {
  it("打开底部日历并选择日期", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 20, 13, 10, 33));
    const { onDateChange } = renderPicker();

    fireEvent.click(screen.getByRole("button", { name: "选择记账时间" }));

    expect(
      screen.getByRole("button", { name: "手动选择年月" }),
    ).toHaveTextContent("2026年6月");
    expect(
      screen.getByRole("button", { name: "2026年6月20日" }),
    ).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "2026年6月18日" }));

    expect(onDateChange).toHaveBeenCalledWith("2026-06-18");
  });

  it("可切换月份并打开时刻输入", () => {
    renderPicker();

    fireEvent.click(
      screen.getByRole("button", {
        name: "选择记账时间",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "下个月" }));

    expect(screen.getByText("2026年7月")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "选择时刻" }));

    expect(
      screen.getByRole("button", { name: "选择 13 时" }),
    ).toBeInTheDocument();
  });

  it("点击月份标题可手动选择年月", () => {
    vi.useFakeTimers();
    setScrollEndSupport(false);
    renderPicker();

    fireEvent.click(screen.getByRole("button", { name: "选择记账时间" }));
    fireEvent.click(screen.getByRole("button", { name: "手动选择年月" }));
    scrollPickerOption("选择 2028 年");
    finishPickerScroll();
    scrollPickerOption("选择 9 月");
    finishPickerScroll();
    fireEvent.click(screen.getByRole("button", { name: "确定年月" }));

    expect(
      screen.getByRole("button", { name: "手动选择年月" }),
    ).toHaveTextContent("2028年9月");
  }, 15000); // 年份列有 101 个选项，jsdom 逐一 Object.defineProperty 耗时较长

  it("滚动结束后才更新小时分钟", () => {
    vi.useFakeTimers();
    setScrollEndSupport(false);
    const { onTimeChange } = renderPicker();

    fireEvent.click(screen.getByRole("button", { name: "选择记账时间" }));
    fireEvent.click(screen.getByRole("button", { name: "选择时刻" }));
    scrollPickerOption("选择 18 时");

    expect(onTimeChange).not.toHaveBeenCalled();

    finishPickerScroll();

    expect(onTimeChange).toHaveBeenCalledWith("18:10:33");

    scrollPickerOption("选择 45 分");

    expect(onTimeChange).toHaveBeenCalledTimes(1);

    finishPickerScroll();

    expect(onTimeChange).toHaveBeenCalledWith("13:45:33");
  });

  it("支持 scrollend 事件结束后更新时刻", () => {
    setScrollEndSupport(true);
    const { onTimeChange } = renderPicker();

    fireEvent.click(screen.getByRole("button", { name: "选择记账时间" }));
    fireEvent.click(screen.getByRole("button", { name: "选择时刻" }));
    const container = scrollPickerOption("选择 18 时");

    expect(onTimeChange).not.toHaveBeenCalled();

    fireEvent(container, new Event("scrollend"));

    expect(onTimeChange).toHaveBeenCalledWith("18:10:33");
  });

  it("点击选项后忽略程序滚动的中间事件", () => {
    vi.useFakeTimers();
    setScrollEndSupport(false);
    const { onTimeChange } = renderPicker();

    fireEvent.click(screen.getByRole("button", { name: "选择记账时间" }));
    fireEvent.click(screen.getByRole("button", { name: "选择时刻" }));

    const option = screen.getByRole("button", { name: "选择 18 时" });
    const container = option.parentElement;

    if (!container) {
      throw new Error("小时列容器不存在");
    }

    fireEvent.click(option);
    fireEvent.scroll(container);
    finishPickerScroll();

    expect(onTimeChange).toHaveBeenCalledTimes(1);
    expect(onTimeChange).toHaveBeenCalledWith("18:10:33");
  });

  it("scrollend 路径下点击选项后程序滚动锁内触发的 scrollend 不重复更新", () => {
    vi.useFakeTimers();
    setScrollEndSupport(true);
    const { onTimeChange } = renderPicker();

    fireEvent.click(screen.getByRole("button", { name: "选择记账时间" }));
    fireEvent.click(screen.getByRole("button", { name: "选择时刻" }));

    const option = screen.getByRole("button", { name: "选择 18 时" });
    const container = option.parentElement;

    if (!container) {
      throw new Error("小时列容器不存在");
    }

    fireEvent.click(option);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    fireEvent(container, new Event("scrollend"));

    expect(onTimeChange).toHaveBeenCalledTimes(1);
    expect(onTimeChange).toHaveBeenCalledWith("18:10:33");
  });

  it("scrollend 路径下程序滚动锁过期后不会吞掉用户滚动", () => {
    vi.useFakeTimers();
    setScrollEndSupport(true);
    const { onTimeChange } = renderPicker();

    fireEvent.click(screen.getByRole("button", { name: "选择记账时间" }));
    fireEvent.click(screen.getByRole("button", { name: "选择时刻" }));

    fireEvent.click(screen.getByRole("button", { name: "选择 18 时" }));

    act(() => {
      vi.advanceTimersByTime(501);
    });

    const container = scrollPickerOption("选择 20 时");
    fireEvent(container, new Event("scrollend"));

    expect(onTimeChange).toHaveBeenCalledWith("20:10:33");
  });

  it("日期与时刻面板可同时显示", () => {
    renderPicker();

    fireEvent.click(screen.getByRole("button", { name: "选择记账时间" }));
    fireEvent.click(screen.getByRole("button", { name: "选择时刻" }));

    expect(screen.getByRole("grid", { name: "记账日期" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "选择 13 时" }),
    ).toBeInTheDocument();
  });
});
