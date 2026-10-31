import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageFormActions } from "./PageFormActions";

const props = {
  cancelHref: "/accounts",
  cancelLabel: "取消",
  pendingLabel: "保存中",
  submitLabel: "保存账户",
};

describe("PageFormActions", () => {
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

  it("提交中显示加载并禁用保存", () => {
    render(<PageFormActions {...props} pending />);

    expect(screen.getByLabelText("保存中").closest("button")).toBeDisabled();
    expect(screen.queryByText("保存账户")).toBeNull();
  });
});
