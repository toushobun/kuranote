import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MerchantAddSheet } from "./MerchantAddSheet";
describe("MerchantAddSheet", () => {
  it("提供预设和手动两个入口，手动添加沿用现有地址", () => {
    const onPreset = vi.fn();
    render(<MerchantAddSheet onClose={vi.fn()} onPreset={onPreset} open />);
    fireEvent.click(screen.getByRole("button", { name: /从预设添加/ }));
    expect(onPreset).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText("从常用商家中勾选，自动带上官网和别名"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /手动添加/ })).toHaveAttribute(
      "href",
      "/merchants/new",
    );
  });
});
