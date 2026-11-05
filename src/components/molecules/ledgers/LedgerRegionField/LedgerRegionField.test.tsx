import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LedgerRegionField } from "./LedgerRegionField";

describe("LedgerRegionField", () => {
  it("只有日本和中国两个选项，未选时不猜测地区", () => {
    const change = vi.fn();
    render(<LedgerRegionField value={null} onChange={change} />);
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.getByRole("radio", { name: "日本" })).not.toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "中国" }));
    expect(change).toHaveBeenCalledWith("cn");
  });
  it("已保存地区优先，保存中禁止更改", () => {
    render(<LedgerRegionField value="jp" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("radio", { name: "日本" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "中国" })).toBeDisabled();
  });
});
