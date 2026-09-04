import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MerchantAvatar } from "./MerchantAvatar";

afterEach(cleanup);

describe("MerchantAvatar", () => {
  it("使用商家插画作为头像加载前和失败后的占位", () => {
    const { container } = render(
      <MerchantAvatar size={72} toneKey="merchant-1" />,
    );

    const placeholder = container.querySelector(
      'img[src="/assets/kura-icons/merchant.png"]',
    );

    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveStyle({ objectFit: "contain" });
  });

  it("已上传头像使用 cover 裁切且不应用头像内边距", () => {
    const { container } = render(
      <MerchantAvatar
        padding={2}
        size={72}
        src="https://example.com/merchant-logo.png"
        toneKey="merchant-1"
      />,
    );

    const uploadedAvatar = container.querySelector(".MerchantAvatar-image");

    expect(uploadedAvatar).toBeInTheDocument();
    expect(uploadedAvatar).toHaveStyle({ objectFit: "cover" });
    expect(uploadedAvatar).not.toHaveStyle({ padding: "16px" });
  });

  it("抓取中在头像上显示加载指示", () => {
    render(<MerchantAvatar loading size={72} toneKey="merchant-1" />);

    expect(screen.getByLabelText("正在获取商家头像")).toBeInTheDocument();
  });
});
