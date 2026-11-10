import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccountAvatar } from "./AccountAvatar";

describe("AccountAvatar", () => {
  it("显示网站图标，加载失败后改用账户名文字", () => {
    const iconUrl = "https://example.com/icon.png";
    const { container } = render(
      <AccountAvatar
        id="account-1"
        iconUrl={iconUrl}
        name="三井住友银行"
        size={48}
      />,
    );
    const image = container.querySelector("img")!;
    expect(image).toHaveAttribute("src", iconUrl);
    fireEvent.error(image);
    expect(screen.getByText("三井")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("显示账户名的文字图标", () => {
    render(<AccountAvatar id="account-1" name="三井住友银行" size={48} />);

    expect(screen.getByText("三井")).toBeInTheDocument();
  });

  it("英文名显示首字母", () => {
    render(<AccountAvatar id="account-2" name="Rakuten Card" size={28} />);

    expect(screen.getByText("RC")).toBeInTheDocument();
  });
});
