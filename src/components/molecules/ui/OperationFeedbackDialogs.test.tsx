import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserThemeProvider } from "theme/UserThemeProvider";
import { getUserThemeStorageKey } from "theme/userThemeStorage";

import {
  ConfirmationDialog,
  FailureFeedbackDialog,
  SuccessFeedbackDialog,
} from "./OperationFeedbackDialogs";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-user-theme");
});

const storageScope = "operation-feedback-dialog-test";

function renderWithUserTheme(children: ReactNode) {
  return render(
    <UserThemeProvider storageScope={storageScope}>
      {children}
    </UserThemeProvider>,
  );
}

describe("SuccessFeedbackDialog", () => {
  it("显示标题、说明文，点击关闭按钮触发回调", () => {
    const onClose = vi.fn();

    render(
      <SuccessFeedbackDialog
        description="这条记录已经保存。"
        onClose={onClose}
        open
        title="保存成功"
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("保存成功");
    expect(screen.getByText("这条记录已经保存。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "关闭" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("3 秒后自动触发关闭回调", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(
      <SuccessFeedbackDialog
        description="这条记录已经保存。"
        onClose={onClose}
        open
        title="保存成功"
      />,
    );

    vi.advanceTimersByTime(2999);
    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});

describe("FailureFeedbackDialog", () => {
  it("显示失败内容并触发关闭回调", () => {
    const onClose = vi.fn();

    render(
      <FailureFeedbackDialog
        description="请稍后再试。"
        onClose={onClose}
        open
        title="保存失败"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("保存失败");
    expect(screen.getByText("请稍后再试。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "关闭" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("ConfirmationDialog", () => {
  it("显示取消与确认按钮并触发各自回调", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    renderWithUserTheme(
      <ConfirmationDialog
        confirmLabel="删除"
        description="删除后无法恢复。"
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        title="确认删除这条记录？"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    fireEvent.click(screen.getByRole("button", { name: "删除" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("按用户主题显示删除确认插图", () => {
    window.localStorage.setItem(
      getUserThemeStorageKey(storageScope),
      "deepSeaStarlight",
    );
    document.documentElement.dataset.userTheme = "deepSeaStarlight";

    renderWithUserTheme(
      <ConfirmationDialog
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        open
        title="确认删除？"
      />,
    );

    expect(document.querySelector("img")).toHaveAttribute(
      "src",
      "/assets/kura-delete-confirm/delete_illustration_deep_sea.png",
    );
  });

  it("支持替换默认插图和按钮文案", () => {
    renderWithUserTheme(
      <ConfirmationDialog
        cancelLabel="返回"
        confirmLabel="继续"
        illustration={<div data-testid="custom-illustration" />}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        open
        title="继续操作？"
      />,
    );

    expect(screen.getByTestId("custom-illustration")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "继续" })).toBeInTheDocument();
  });
});
