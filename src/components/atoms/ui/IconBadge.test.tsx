import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { IconBadge } from "./IconBadge";

afterEach(() => {
  cleanup();
});

describe("IconBadge", () => {
  it("使用可访问名称显示图标底座", () => {
    render(<IconBadge label="账户图标">账</IconBadge>);

    expect(screen.getByRole("img", { name: "账户图标" })).toBeInTheDocument();
  });
});
