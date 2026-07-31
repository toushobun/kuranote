import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ErrorRetryButton, ErrorState } from "./ErrorState";

afterEach(() => {
  cleanup();
});

describe("ErrorState", () => {
  it("以 alert 显示错误状态", () => {
    const { container } = render(
      <ErrorState title="账户操作失败" description="账户新增失败。" />,
    );

    expect(within(container).getByRole("alert")).toBeInTheDocument();
    expect(within(container).getByText("账户操作失败")).toBeInTheDocument();
    expect(within(container).getByText("账户新增失败。")).toBeInTheDocument();
  });

  it("显示重试按钮", () => {
    const { container } = render(<ErrorRetryButton />);

    expect(
      within(container).getByRole("button", { name: "重试" }),
    ).toBeInTheDocument();
  });
});
