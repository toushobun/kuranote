import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataImportIssueList } from "./DataImportIssueList";

describe("DataImportIssueList", () => {
  it("按工作表展示原因，列名仅用于分组而不重复显示", () => {
    render(
      <DataImportIssueList
        issues={[
          { reason: "缺少必填列。", rows: [] },
          {
            sheet: "incomeExpense",
            column: "金额",
            reason: "金额格式不正确。",
            rows: [2, 5],
          },
          {
            sheet: "transfer",
            reason: "转出账户不能为空。",
            rows: [3],
          },
        ]}
      />,
    );
    expect(screen.getByText("文件结构")).toBeInTheDocument();
    expect(screen.getByText("缺少必填列。")).toBeInTheDocument();
    expect(screen.getByText("收支")).toBeInTheDocument();
    expect(screen.getByText("第 2、5 行：金额格式不正确。")).toBeInTheDocument();
    expect(screen.getByText("转账")).toBeInTheDocument();
    expect(screen.getByText("第 3 行：转出账户不能为空。")).toBeInTheDocument();
    expect(screen.queryByText(/还有 \d+ 处/)).not.toBeInTheDocument();
  });
});
