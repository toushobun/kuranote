import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataImportExportTemplate } from "./DataImportExport";

describe("DataImportExportTemplate", () => {
  it("显示标题、说明和返回设置入口", () => {
    render(<DataImportExportTemplate />);

    expect(
      screen.getByRole("heading", { name: "数据导入导出" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("迁移历史记账数据，或导出当前账本数据备份"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "返回设置" })).toHaveAttribute(
      "href",
      "/settings",
    );
  });

  it("提供跳转到数据导入页面的入口", () => {
    render(<DataImportExportTemplate />);

    const importEntry = screen.getByRole("link", { name: /数据导入/ });

    expect(importEntry).toHaveAttribute("href", "/settings/data/import");
    expect(
      within(importEntry).getByText("从 xlsx 文件批量导入收支和转账记录"),
    ).toBeInTheDocument();
  });

  it("提供跳转到数据导出页面的入口", () => {
    render(<DataImportExportTemplate />);

    const exportEntry = screen.getByRole("link", { name: /数据导出/ });

    expect(exportEntry).toHaveAttribute("href", "/settings/data/export");
    expect(
      within(exportEntry).getByText("将当前账本数据导出为文件，方便备份或迁移"),
    ).toBeInTheDocument();
  });
});
