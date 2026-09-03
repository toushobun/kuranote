import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { designTokens } from "theme/theme";

import { IconBadge } from "./IconBadge";

afterEach(() => {
  cleanup();
});

describe("IconBadge", () => {
  it("使用可访问名称和统一圆角显示图标底座", () => {
    render(<IconBadge label="账户图标">账</IconBadge>);

    expect(screen.getByRole("img", { name: "账户图标" })).toHaveStyle({
      borderRadius: `${designTokens.radius.sm}px`,
    });
  });
});
