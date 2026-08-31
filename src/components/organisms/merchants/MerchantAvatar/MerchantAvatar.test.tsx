import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MerchantAvatar } from "./MerchantAvatar";

afterEach(cleanup);

describe("MerchantAvatar", () => {
  it("使用商家插画作为头像加载前和失败后的占位", () => {
    const { container } = render(
      <MerchantAvatar size={72} toneKey="merchant-1" />,
    );

    expect(
      container.querySelector('img[src="/assets/kura-icons/merchant.png"]'),
    ).toBeInTheDocument();
  });

  it("抓取中在头像上显示加载指示", () => {
    render(<MerchantAvatar loading size={72} toneKey="merchant-1" />);

    expect(screen.getByLabelText("正在获取商家头像")).toBeInTheDocument();
  });
});
