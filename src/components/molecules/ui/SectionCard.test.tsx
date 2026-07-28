import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionCard } from "./SectionCard";

describe("SectionCard", () => {
  it("渲染卡片内容并透传 Card 属性", () => {
    render(
      <SectionCard aria-label="账户概览">
        <span>本月账户</span>
      </SectionCard>,
    );

    expect(screen.getByText("本月账户")).toBeInTheDocument();
    expect(screen.getByLabelText("账户概览")).toHaveClass("MuiCard-root");
  });

  it("在默认卡片样式之后应用外部 sx", () => {
    render(
      <SectionCard data-testid="section-card" sx={{ opacity: 0.5, p: 0 }}>
        内容
      </SectionCard>,
    );

    expect(screen.getByTestId("section-card")).toHaveStyle({
      opacity: "0.5",
      padding: "0px",
    });
  });
});
