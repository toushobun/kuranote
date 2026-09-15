import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataTransferPlaceholderTemplate } from "./DataTransferPlaceholder";

describe("DataTransferPlaceholderTemplate", () => {
  it("导入占位页显示标题、即将上线提示和返回入口", () => {
    render(<DataTransferPlaceholderTemplate kind="import" />);

    expect(
      screen.getByRole("heading", { name: "数据导入" }),
    ).toBeInTheDocument();
    expect(screen.getByText("数据导入功能即将上线")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "返回数据导入导出" }),
    ).toHaveAttribute("href", "/settings/data");
  });

  it("导出占位页显示标题、即将上线提示和返回入口", () => {
    render(<DataTransferPlaceholderTemplate kind="export" />);

    expect(
      screen.getByRole("heading", { name: "数据导出" }),
    ).toBeInTheDocument();
    expect(screen.getByText("数据导出功能即将上线")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "返回数据导入导出" }),
    ).toHaveAttribute("href", "/settings/data");
  });
});
