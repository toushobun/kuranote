import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TransactionConsumerOption } from "types/transactions";

import { TransactionConsumerProvider } from "./TransactionConsumerContext";
import { TransactionConsumerSelector } from "./TransactionConsumerSelector";

const recorderId = "00000000-0000-4000-8000-000000000001";
const partnerId = "00000000-0000-4000-8000-000000000002";

const options: TransactionConsumerOption[] = [
  { color: "jade", id: recorderId, name: "淞文" },
  { color: "sakura", id: partnerId, name: "秋爽" },
];

function renderSelector(initialConsumerUserIds?: string[]) {
  return render(
    <form>
      <TransactionConsumerProvider
        value={{
          consumerOptions: options,
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
    expect(container.querySelector('input[name="consumerUserId"]')).toHaveValue(
      recorderId,
    );
  });

  it("点击入口后展开多选消费者输入", () => {
    renderSelector();

    fireEvent.click(screen.getByRole("button", { name: "+ 指定消费者" }));

    expect(
      screen.getByRole("combobox", { name: "消费者" }),
    ).toBeInTheDocument();
    expect(screen.getByText("淞文")).toBeInTheDocument();
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
