import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MerchantDetailsFields } from "./MerchantDetailsFields";

afterEach(cleanup);

const baseProps = {
  fetchIconAction: vi.fn(
    async (_previous: unknown, _formData: FormData) => ({}),
  ),
  ledgerId: "ledger-1",
  name: "Amazon",
  note: "网购",
  onNameChange: vi.fn(),
  onNoteChange: vi.fn(),
  onWebsiteUrlChange: vi.fn(),
  websiteUrl: "https://www.amazon.co.jp",
};

describe("MerchantDetailsFields", () => {
  it("显示当前值且不会随网址自动请求图标", () => {
    const fetchIconAction = vi.fn(
      async (_previous: unknown, _formData: FormData) => ({}),
    );
    const { container } = render(
      <MerchantDetailsFields
        {...baseProps}
        fetchIconAction={fetchIconAction}
      />,
    );

    expect(screen.getByLabelText(/商家名称/)).toHaveValue("Amazon");
    expect(screen.getByLabelText("商家网址")).toHaveValue(
      "https://www.amazon.co.jp",
    );
    expect(screen.getByLabelText("备注（可选）")).toHaveValue("网购");
    expect(
      screen.getByText("填写网址后，可按需获取网站图标"),
    ).toBeInTheDocument();
    expect(fetchIconAction).not.toHaveBeenCalled();
    expect(
      container.querySelector('img[src="/assets/kura-icons/merchant.png"]'),
    ).toBeInTheDocument();
  });

  it("输入变化时分别通知上层状态且不抓取图标", () => {
    const onNameChange = vi.fn();
    const onWebsiteUrlChange = vi.fn();
    const onNoteChange = vi.fn();
    const fetchIconAction = vi.fn(
      async (_previous: unknown, _formData: FormData) => ({}),
    );
    render(
      <MerchantDetailsFields
        {...baseProps}
        fetchIconAction={fetchIconAction}
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
    expect(fetchIconAction).not.toHaveBeenCalled();
  });

  it("点击获取图标后只请求预览并通过隐藏字段等待表单保存", async () => {
    const fetchIconAction = vi.fn(
      async (_previous: unknown, _formData: FormData) => ({
        iconUrl:
          "https://t2.gstatic.com/faviconV2?url=https://www.amazon.co.jp",
        success: "网站图标已获取，保存后会缓存",
      }),
    );
    const { container } = render(
      <MerchantDetailsFields
        {...baseProps}
        fetchIconAction={fetchIconAction}
        merchantId="00000000-0000-4000-8000-000000001001"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "获取图标" }));

    expect(screen.getByText("正在获取并验证网站图标")).toBeInTheDocument();
    expect(
      await screen.findByText("网站图标已获取，保存后会缓存"),
    ).toBeInTheDocument();
    expect(fetchIconAction).toHaveBeenCalledTimes(1);
    const formData = fetchIconAction.mock.calls[0]?.[1];
    expect(formData?.get("websiteUrl")).toBe("https://www.amazon.co.jp");
    expect(formData?.get("merchantId")).toBeNull();
    expect(container.querySelector('input[name="previewIconUrl"]')).toHaveValue(
      "https://t2.gstatic.com/faviconV2?url=https://www.amazon.co.jp",
    );
    expect(container.querySelector(".MerchantAvatar-image")).toHaveAttribute(
      "src",
      expect.stringContaining("t2.gstatic.com"),
    );
  });

  it("获取失败时显示 Action 返回的安全文案", async () => {
    const fetchIconAction = vi.fn(
      async (_previous: unknown, _formData: FormData) => ({
        error: "未能获取网站图标，请确认网址后重试。",
      }),
    );
    render(
      <MerchantDetailsFields
        {...baseProps}
        fetchIconAction={fetchIconAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "获取图标" }));

    expect(
      await screen.findByText("未能获取网站图标，请确认网址后重试。"),
    ).toBeInTheDocument();
  });

  it("直接显示数据库中已缓存的图标", () => {
    const { container } = render(
      <MerchantDetailsFields
        {...baseProps}
        initialIconUrl="https://t2.gstatic.com/faviconV2?url=https://example.com"
      />,
    );

    expect(screen.getByText("网站图标已缓存")).toBeInTheDocument();
    expect(container.querySelector(".MerchantAvatar-image")).toHaveAttribute(
      "src",
      "https://t2.gstatic.com/faviconV2?url=https://example.com",
    );
  });

  it("网址变化时清除旧预览，避免保存不匹配的图标", () => {
    const { container } = render(
      <MerchantDetailsFields
        {...baseProps}
        initialIconUrl="https://t2.gstatic.com/faviconV2?url=https://example.com"
      />,
    );

    fireEvent.change(screen.getByLabelText("商家网址"), {
      target: { value: "https://new.example.com" },
    });

    expect(container.querySelector('input[name="previewIconUrl"]')).toHaveValue(
      "",
    );
    expect(
      container.querySelector('img[src="/assets/kura-icons/merchant.png"]'),
    ).toBeInTheDocument();
  });

  it("网址为空时禁用获取按钮", () => {
    render(<MerchantDetailsFields {...baseProps} websiteUrl="" />);

    expect(screen.getByRole("button", { name: "获取图标" })).toBeDisabled();
  });
});
