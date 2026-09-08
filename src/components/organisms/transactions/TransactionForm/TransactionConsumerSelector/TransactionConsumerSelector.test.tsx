import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TransactionConsumerOption } from "types/transactions";

import { TransactionConsumerProvider } from "../TransactionConsumerContext";
import { TransactionConsumerSelector } from "./TransactionConsumerSelector";

const recorderId = "00000000-0000-4000-8000-000000000001";
const partnerId = "00000000-0000-4000-8000-000000000002";

const options: TransactionConsumerOption[] = [
  { color: "jade", id: recorderId, name: "淞文" },
  { color: "sakura", id: partnerId, name: "秋爽" },
];

function renderSelector(
  initialConsumerUserIds?: string[],
  consumerOptions = options,
) {
  return render(
    <form>
      <TransactionConsumerProvider
        value={{
          consumerOptions,
          initialConsumerUserIds,
          recorderUserId: recorderId,
        }}
      >
        <TransactionConsumerSelector />
      </TransactionConsumerProvider>
    </form>,
  );
}

describe("TransactionConsumerSelector", () => {
  it("默认消费者仅为记录人时折叠显示指定消费者入口", () => {
    const { container } = renderSelector();

    expect(
      screen.getByRole("button", { name: "+ 指定消费者" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "消费者" })).toBeNull();
    expect(
      new FormData(container.querySelector("form")!).getAll("consumerUserId"),
    ).toEqual([]);
  });

  it("点击入口后展开多选消费者输入并显式提交选择", () => {
    const { container } = renderSelector();

    fireEvent.click(screen.getByRole("button", { name: "+ 指定消费者" }));

    expect(
      screen.getByRole("combobox", { name: "消费者" }),
    ).toBeInTheDocument();
    expect(screen.getByText("淞文")).toBeInTheDocument();
    expect(
      new FormData(container.querySelector("form")!).getAll("consumerUserId"),
    ).toEqual([recorderId]);
  });

  it("编辑页默认消费者折叠时不提交字段，保留现有消费者", () => {
    const { container } = renderSelector([recorderId]);
    expect(screen.queryByRole("combobox", { name: "消费者" })).toBeNull();
    expect(
      new FormData(container.querySelector("form")!).getAll("consumerUserId"),
    ).toEqual([]);
  });

  it("编辑数据明确没有消费者时按非默认状态直接展开", () => {
    const { container } = renderSelector([]);

    expect(screen.queryByRole("button", { name: "+ 指定消费者" })).toBeNull();
    expect(
      screen.getByRole("combobox", { name: "消费者" }),
    ).toBeInTheDocument();
    expect(container.querySelector('input[name="consumerUserId"]')).toHaveValue(
      "",
    );
  });

  it("编辑数据消费者不是仅记录人时初始直接展开", () => {
    const { container } = renderSelector([partnerId]);

    expect(screen.queryByRole("button", { name: "+ 指定消费者" })).toBeNull();
    expect(
      screen.getByRole("combobox", { name: "消费者" }),
    ).toBeInTheDocument();
    expect(screen.getByText("秋爽")).toBeInTheDocument();
    expect(container.querySelector('input[name="consumerUserId"]')).toHaveValue(
      partnerId,
    );
  });

  it.each([1, 2])(
    "记录人已退出且剩余 %i 个成员时显示错误并允许修正消费者",
    (memberCount) => {
      const activeOptions = [
        options[1]!,
        {
          id: "00000000-0000-4000-8000-000000000003",
          name: "宝宝",
          color: "sky" as const,
        },
      ].slice(0, memberCount);
      const { container } = renderSelector([recorderId], activeOptions);
      const input = screen.getByRole("combobox", { name: "消费者" });
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(screen.queryByRole("button", { name: "+ 指定消费者" })).toBeNull();
      expect(
        new FormData(container.querySelector("form")!).getAll("consumerUserId"),
      ).toEqual([recorderId]);
      fireEvent.mouseDown(input);
      fireEvent.click(screen.getByRole("option", { name: /秋爽/ }));
      expect(
        new FormData(container.querySelector("form")!).getAll("consumerUserId"),
      ).toEqual([partnerId]);
      expect(input).toHaveAttribute("aria-invalid", "false");
      fireEvent.click(screen.getByRole("option", { name: /秋爽/ }));
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(
        new FormData(container.querySelector("form")!).getAll("consumerUserId"),
      ).toEqual([""]);
    },
  );

  it("有效和失效消费者混合时不静默丢弃失效 ID", () => {
    const invalidId = "00000000-0000-4000-8000-000000000009";
    const { container } = renderSelector([partnerId, invalidId]);
    expect(screen.getByRole("combobox", { name: "消费者" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(
      new FormData(container.querySelector("form")!).getAll("consumerUserId"),
    ).toEqual([partnerId, invalidId]);
  });

  it("单人账本隐藏消费者入口", () => {
    render(
      <TransactionConsumerProvider
        value={{
          consumerOptions: [options[0]!],
          recorderUserId: recorderId,
        }}
      >
        <TransactionConsumerSelector />
      </TransactionConsumerProvider>,
    );

    expect(screen.queryByRole("button", { name: "+ 指定消费者" })).toBeNull();
    expect(screen.queryByRole("combobox", { name: "消费者" })).toBeNull();
  });
});
