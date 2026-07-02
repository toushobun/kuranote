import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ResultFeedback } from "./ResultFeedback";

afterEach(() => {
  cleanup();
});

describe("ResultFeedback", () => {
  it("渲染标题、说明和操作按钮", () => {
    const handleAction = vi.fn();
    const { container } = render(
      <ResultFeedback
        variant="success"
        title="保存完成"
        message="记录已经保存。"
        actionLabel="返回列表"
        onAction={handleAction}
      />,
    );

    expect(within(container).getByText("保存完成")).toBeInTheDocument();
    expect(within(container).getByText("记录已经保存。")).toBeInTheDocument();

    fireEvent.click(
      within(container).getByRole("button", { name: "返回列表" }),
    );

    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it("错误状态使用 alert role", () => {
    const { container } = render(
      <ResultFeedback
        variant="error"
        title="操作没有完成"
        message="请稍后再试。"
      />,
    );

    expect(within(container).getByRole("alert")).toHaveAttribute(
      "data-variant",
      "error",
    );
  });

  it("切换 variant 时同步更新状态标记", () => {
    const { container, rerender } = render(
      <ResultFeedback variant="empty" title="没有内容" />,
    );

    expect(within(container).getByRole("status")).toHaveAttribute(
      "data-variant",
      "empty",
    );

    rerender(<ResultFeedback variant="info" title="确认中" />);

    expect(within(container).getByRole("status")).toHaveAttribute(
      "data-variant",
      "info",
    );
  });

  it("优先渲染自定义 action slot", () => {
    const { container } = render(
      <ResultFeedback
        title="需要确认"
        action={<button type="button">自定义操作</button>}
        actionLabel="默认操作"
      />,
    );

    expect(
      within(container).getByRole("button", { name: "自定义操作" }),
    ).toBeInTheDocument();
    expect(
      within(container).queryByRole("button", { name: "默认操作" }),
    ).not.toBeInTheDocument();
  });

  it("支持替换默认图标", () => {
    const { container } = render(
      <ResultFeedback
        title="保存完成"
        icon={<CheckCircleOutlineRoundedIcon titleAccess="自定义成功图标" />}
      />,
    );

    expect(within(container).getByTitle("自定义成功图标")).toBeInTheDocument();
  });
});
