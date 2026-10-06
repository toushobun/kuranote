import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { designTokens } from "theme/theme";

import { DataItemCard } from "./DataItemCard";

afterEach(() => {
  cleanup();
});

// jsdom 不会按媒体查询计算响应式样式，因此直接读取元素对应的 emotion 样式规则。
function getElementCssText(element: HTMLElement) {
  const classNames = Array.from(element.classList).filter((className) =>
    className.startsWith("css-"),
  );
  const cssText = Array.from(document.querySelectorAll("style"))
    .map((style) => style.textContent ?? "")
    .join("");

  return cssText
    .split("}")
    .filter((rule) => classNames.some((className) => rule.includes(className)))
    .join("}");
}

describe("DataItemCard", () => {
  it("渲染子元素内容", () => {
    const { container } = render(
      <DataItemCard>
        <span>卡片内容</span>
      </DataItemCard>,
    );

    expect(within(container).getByText("卡片内容")).toBeInTheDocument();
  });

  it("使用数据卡片圆角 token 与默认内边距", () => {
    const { container } = render(
      <DataItemCard data-testid="data-item-card">内容</DataItemCard>,
    );

    const card = within(container).getByTestId("data-item-card");
    expect(card).toHaveStyle({
      borderRadius: `${designTokens.radius.md}px`,
    });
    const cssText = getElementCssText(card);
    expect(cssText).toContain("padding:12px");
    expect(cssText).toContain("padding:14px");
  });

  it("disablePadding 时移除卡片内边距", () => {
    const { container } = render(
      <DataItemCard data-testid="data-item-card" disablePadding>
        内容
      </DataItemCard>,
    );

    const cssText = getElementCssText(
      within(container).getByTestId("data-item-card"),
    );
    expect(cssText).toContain("padding:0");
    expect(cssText).not.toContain("padding:12px");
  });

  it("透传额外的 sx 属性", () => {
    const { container } = render(
      <DataItemCard data-testid="data-item-card" sx={{ overflow: "hidden" }}>
        内容
      </DataItemCard>,
    );

    expect(within(container).getByTestId("data-item-card")).toHaveStyle({
      overflow: "hidden",
    });
  });
});
