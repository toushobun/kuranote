import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MerchantTagIconField } from "./MerchantTagIconField";

describe("MerchantTagIconField", () => {
  it("使用商家标签专属候选图标", () => {
    const onChange = vi.fn();
    render(<MerchantTagIconField onChange={onChange} value="🛒" />);
    fireEvent.click(screen.getByRole("button", { name: "选择图标" }));
    fireEvent.change(screen.getByLabelText("搜索图标"), {
      target: { value: "通讯" },
    });
    fireEvent.click(screen.getByRole("button", { name: "选择通讯图标" }));
    fireEvent.click(screen.getByRole("button", { name: "确定" }));
    expect(onChange).toHaveBeenCalledWith("📶");
  });
});
