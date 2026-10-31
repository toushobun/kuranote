import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AccountTypePicker } from "./AccountTypePicker";

describe("AccountTypePicker", () => {
  it("显示 5 种账户类型的单选格子，未选择时都不选中且为必填", () => {
    render(<AccountTypePicker name="type" onChange={vi.fn()} value={null} />);

    const radios = screen.getAllByRole("radio");
    expect(radios.map((radio) => radio.getAttribute("value"))).toEqual([
      "cash",
      "bank",
      "credit_card",
      "e_money",
      "other",
    ]);
    for (const radio of radios) {
      expect(radio).not.toBeChecked();
      expect(radio).toBeRequired();
    }
    expect(screen.getByRole("radiogroup", { name: "账户类型" })).toBeVisible();
  });

  it("点击格子时回传类型，选中项跟随 value", () => {
    const onChange = vi.fn();
    render(
      <AccountTypePicker name="type" onChange={onChange} value="credit_card" />,
    );

    expect(screen.getByRole("radio", { name: "信用卡" })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "银行卡" }));

    expect(onChange).toHaveBeenCalledWith("bank");
  });
});
