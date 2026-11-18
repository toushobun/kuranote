import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PageFormActions } from "./PageFormActions";

const props = {
  cancelHref: "/accounts",
  cancelLabel: "取消",
  pendingLabel: "保存中…",
  submitLabel: "保存账户",
};

describe("PageFormActions", () => {
  it("弹层取消是普通按钮，只执行回调", () => {
    const onCancel = vi.fn();
    render(
      <PageFormActions
        cancelLabel={props.cancelLabel}
        pendingLabel={props.pendingLabel}
        submitLabel={props.submitLabel}
        onCancel={onCancel}
      />,
    );
    const cancel = screen.getByRole("button", { name: "取消" });
    expect(cancel).toHaveAttribute("type", "button");
    fireEvent.click(cancel);
    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.queryByRole("link")).toBeNull();
  });
  it("取消链接回到指定页面，保存为提交按钮", () => {
    render(<PageFormActions {...props} />);

    expect(screen.getByRole("link", { name: "取消" })).toHaveAttribute(
      "href",
      "/accounts",
    );
    expect(screen.getByRole("button", { name: "保存账户" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("提交中保留原色、名称和加载状态并禁用保存", async () => {
    render(<PageFormActions {...props} pending />);
    const button = screen.getByRole("button", { name: "保存中…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByRole("progressbar")).toBeInTheDocument();
  });

  it("submitDisabled 时禁用保存但仍显示文字", () => {
    render(<PageFormActions {...props} submitDisabled />);

    expect(screen.getByRole("button", { name: "保存账户" })).toBeDisabled();
  });

  it("保存中取消链接不再能导航，取消回调也不能调用", () => {
    const onCancel = vi.fn();
    const { rerender } = render(<PageFormActions {...props} pending />);
    expect(screen.queryByRole("link", { name: "取消" })).toBeNull();
    const cancel = screen.getByRole("button", { name: "取消" });
    expect(cancel).toBeDisabled();
    fireEvent.click(cancel);

    rerender(
      <PageFormActions
        cancelLabel="取消"
        onCancel={onCancel}
        pending
        pendingLabel="保存中…"
        submitLabel="保存账户"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(onCancel).not.toHaveBeenCalled();
  });
});
