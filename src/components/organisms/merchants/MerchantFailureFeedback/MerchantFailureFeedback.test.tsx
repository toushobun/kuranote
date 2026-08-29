import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MerchantFailureFeedback } from "./MerchantFailureFeedback";

afterEach(cleanup);

describe("MerchantFailureFeedback", () => {
  it("显示当前错误并允许关闭", async () => {
    render(
      <MerchantFailureFeedback
        state={{ error: "保存失败，请稍后重试。", errorKey: "error-1" }}
        title="商家更新失败"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("商家更新失败");
    expect(screen.getByText("保存失败，请稍后重试。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("错误标识变化时重新显示同一错误文案", () => {
    const { rerender } = render(
      <MerchantFailureFeedback
        state={{ error: "保存失败。", errorKey: "error-1" }}
        title="商家更新失败"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));

    rerender(
      <MerchantFailureFeedback
        state={{ error: "保存失败。", errorKey: "error-2" }}
        title="商家更新失败"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("保存失败。");
  });
});
