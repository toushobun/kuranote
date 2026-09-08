import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MerchantDisplayNameFeedback } from "./MerchantDisplayNameFeedback";

afterEach(cleanup);

describe("MerchantDisplayNameFeedback", () => {
  it("显示切换成功提示并允许相同文案的新结果再次出现", async () => {
    const { rerender } = render(
      <MerchantDisplayNameFeedback state={{ success: "显示名切换成功" }} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("显示名切换成功");

    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());

    rerender(
      <MerchantDisplayNameFeedback state={{ success: "显示名切换成功" }} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("显示名切换成功");
  });

  it("失败时复用既有错误反馈且不显示成功提示", () => {
    render(
      <MerchantDisplayNameFeedback
        state={{ error: "无法切换显示名", errorKey: "failure-1" }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("展示名更新失败");
    expect(screen.getByRole("alert")).toHaveTextContent("无法切换显示名");
    expect(screen.queryByRole("status")).toBeNull();
  });
});
