import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TransactionLinkPickerBrowseStatus } from "./TransactionLinkPickerBrowseStatus";

describe("TransactionLinkPickerBrowseStatus", () => {
  it("读取中显示加载指示且不显示失败提示", () => {
    render(
      <TransactionLinkPickerBrowseStatus errorMessage="读取失败" isLoading />,
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("读取失败")).not.toBeInTheDocument();
  });

  it("失败后显示原错误文案，并允许重新读取", () => {
    const onRetry = vi.fn();
    render(
      <TransactionLinkPickerBrowseStatus
        errorMessage="读取失败"
        isLoading={false}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText("读取失败")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
