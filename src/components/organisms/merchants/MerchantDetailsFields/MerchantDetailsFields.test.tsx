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
  it("显示当前值、图3示例文案和店铺插画占位", () => {
    const { container } = render(
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
    expect(screen.getByLabelText("商家网址")).toHaveAttribute(
      "placeholder",
      "例如：https://www.example.com",
    );
    expect(screen.getByLabelText("备注（可选）")).toHaveAttribute(
      "placeholder",
      "例如：日常购物与杂货采购",
    );
    expect(container.querySelector(".MerchantAvatar-image")).toHaveAttribute(
      "src",
      expect.stringContaining("/api/ledgers/ledger-1/merchants/icon?"),
    );
    expect(
      container.querySelector('img[src="/assets/kura-icons/merchant.png"]'),
    ).toBeInTheDocument();
    expect(screen.queryByText("Amazon")).not.toBeInTheDocument();
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
    const avatar = container.querySelector(".MerchantAvatar-image");

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

  it("呈现头像抓取中、成功与失败状态", () => {
    const { container } = render(
      <MerchantDetailsFields
        ledgerId="ledger-1"
        name="Amazon"
        note=""
        onNameChange={vi.fn()}
        onNoteChange={vi.fn()}
        onWebsiteUrlChange={vi.fn()}
        websiteUrl="https://www.amazon.co.jp"
      />,
    );
    const avatar = container.querySelector(".MerchantAvatar-image");

    expect(screen.getByText("正在获取网站图标")).toBeInTheDocument();
    fireEvent.load(avatar as Element);
    expect(screen.getByText("已通过网站图标自动获取头像")).toBeInTheDocument();
    fireEvent.error(avatar as Element);
    expect(
      screen.getByText("未能获取网站图标，已使用默认商家头像"),
    ).toBeInTheDocument();
  });

  it("点击刷新按钮后重新请求当前网址的头像", () => {
    const { container } = render(
      <MerchantDetailsFields
        ledgerId="ledger-1"
        name="Amazon"
        note=""
        onNameChange={vi.fn()}
        onNoteChange={vi.fn()}
        onWebsiteUrlChange={vi.fn()}
        websiteUrl="https://www.amazon.co.jp"
      />,
    );
    const avatar = container.querySelector(".MerchantAvatar-image");

    fireEvent.load(avatar as Element);
    expect(avatar).toHaveAttribute("src", expect.stringContaining("refresh=0"));
    fireEvent.click(screen.getByRole("button", { name: "重新获取商家头像" }));

    expect(avatar).toHaveAttribute("src", expect.stringContaining("refresh=1"));
    expect(screen.getByText("正在获取网站图标")).toBeInTheDocument();
  });

  it("网址为空时显示引导并禁用刷新", () => {
    render(
      <MerchantDetailsFields
        ledgerId="ledger-1"
        name=""
        note=""
        onNameChange={vi.fn()}
        onNoteChange={vi.fn()}
        onWebsiteUrlChange={vi.fn()}
        websiteUrl=""
      />,
    );

    expect(
      screen.getByText("填写商家网址后会自动获取头像"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "重新获取商家头像" }),
    ).toBeDisabled();
  });
});
