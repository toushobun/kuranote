import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MerchantTagIconField } from "./MerchantTagIconField";

describe("MerchantTagIconField", () => {
  it("使用商家标签专属候选图标", () => {
    const onChange = vi.fn();
    render(<MerchantTagIconField onChange={onChange} value="🛒" />);
    expect(screen.getByText("分类图标")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "选择图标" }));
    fireEvent.change(screen.getByLabelText("搜索图标"), {
      target: { value: "通讯" },
    });
    fireEvent.click(screen.getByRole("button", { name: "选择通讯图标" }));
    fireEvent.click(screen.getByRole("button", { name: "确定" }));
    expect(onChange).toHaveBeenCalledWith("📶");
  });

  it("默认图标使用分类术语并可按分类搜索", () => {
    render(<MerchantTagIconField onChange={vi.fn()} value="🏷️" />);

    fireEvent.click(screen.getByRole("button", { name: "选择图标" }));
    fireEvent.change(screen.getByLabelText("搜索图标"), {
      target: { value: "分类" },
    });

    expect(
      screen.getByRole("button", { name: "选择分类图标" }),
    ).toBeInTheDocument();
  });
});
