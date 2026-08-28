import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MerchantDetailsFields } from "./MerchantDetailsFields";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("MerchantDetailsFields", () => {
  it("显示当前值、头像地址和名称首字", () => {
    render(
      <MerchantDetailsFields
        ledgerId="ledger-1"
        name="Amazon"
        note="网购"
        onNameChange={vi.fn()}
        onNoteChange={vi.fn()}
        onWebsiteUrlChange={vi.fn()}
        websiteUrl="https://www.amazon.co.jp"
      />,
    );

    expect(screen.getByLabelText(/商家名称/)).toHaveValue("Amazon");
    expect(screen.getByLabelText("商家网址")).toHaveValue(
      "https://www.amazon.co.jp",
    );
    expect(screen.getByLabelText("备注（可选）")).toHaveValue("网购");
    expect(document.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("/api/ledgers/ledger-1/merchants/icon?"),
    );
  });

  it("输入变化时分别通知上层状态", () => {
    const onNameChange = vi.fn();
    const onWebsiteUrlChange = vi.fn();
    const onNoteChange = vi.fn();
    render(
      <MerchantDetailsFields
        ledgerId="ledger-1"
        name=""
        note=""
        onNameChange={onNameChange}
        onNoteChange={onNoteChange}
        onWebsiteUrlChange={onWebsiteUrlChange}
        websiteUrl=""
      />,
    );

    fireEvent.change(screen.getByLabelText(/商家名称/), {
      target: { value: "LIFE超市" },
    });
    fireEvent.change(screen.getByLabelText("商家网址"), {
      target: { value: "https://www.lifecorp.jp" },
    });
    fireEvent.change(screen.getByLabelText("备注（可选）"), {
      target: { value: "常去的超市" },
    });

    expect(onNameChange).toHaveBeenCalledWith("LIFE超市");
    expect(onWebsiteUrlChange).toHaveBeenCalledWith("https://www.lifecorp.jp");
    expect(onNoteChange).toHaveBeenCalledWith("常去的超市");
  });

  it("网址输入停止后再更新头像预览", () => {
    vi.useFakeTimers();
    const props = {
      ledgerId: "ledger-1",
      name: "Amazon",
      note: "",
      onNameChange: vi.fn(),
      onNoteChange: vi.fn(),
      onWebsiteUrlChange: vi.fn(),
    };
    const { container, rerender } = render(
      <MerchantDetailsFields
        {...props}
        websiteUrl="https://www.amazon.co.jp"
      />,
    );
    const avatar = container.querySelector("img");

    rerender(
      <MerchantDetailsFields {...props} websiteUrl="https://www.lifecorp.jp" />,
    );

    expect(avatar).toHaveAttribute(
      "src",
      expect.stringContaining("www.amazon.co.jp"),
    );
    act(() => vi.advanceTimersByTime(400));
    expect(avatar).toHaveAttribute(
      "src",
      expect.stringContaining("www.lifecorp.jp"),
    );
  });
});
