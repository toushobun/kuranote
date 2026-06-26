import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { KuraIcon } from "./KuraIcon";
import { kuraIconLabels, kuraIconNames } from "./kuraIconRegistry";

afterEach(() => {
  cleanup();
});

describe("KuraIcon", () => {
  it("按名称显示可访问图标", () => {
    render(<KuraIcon name="quickRecord" title="快速记账图标" />);

    expect(
      screen.getByRole("img", { name: "快速记账图标" }),
    ).toBeInTheDocument();
  });

  it("未设置标题时作为装饰图标隐藏", () => {
    render(<KuraIcon data-testid="account-icon" name="account" />);

    expect(screen.getByTestId("account-icon")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("注册表中的图标都可以渲染", () => {
    render(
      <>
        {kuraIconNames.map((name) => (
          <KuraIcon key={name} name={name} title={kuraIconLabels[name]} />
        ))}
      </>,
    );

    for (const name of kuraIconNames) {
      expect(
        screen.getByRole("img", { name: kuraIconLabels[name] }),
      ).toBeInTheDocument();
    }
  });
});
