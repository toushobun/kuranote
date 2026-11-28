import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ImportExecutionResult } from "internal/dataImport";
import { DataImportExecutionStatus } from "./DataImportExecutionStatus";

const baseResult: ImportExecutionResult = {
  details: [],
  failureCount: 0,
  createdPlaceholderCount: 0,
  holderMissingCount: 0,
  successCount: 3,
};

const failedDetails: ImportExecutionResult["details"] = [
  {
    reason: "账户已归档。",
    rowNumbers: [2, 3],
    sheet: "incomeExpense",
    status: "failed",
  },
  {
    reason: "账户已归档。",
    rowNumbers: [5],
    sheet: "incomeExpense",
    status: "failed",
  },
];

describe("DataImportExecutionStatus", () => {
  it("全部成功显示成功色且无按钮", () => {
    render(<DataImportExecutionStatus result={baseResult} />);
    expect(screen.getByText("已导入 3 笔")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveClass("MuiAlert-colorSuccess");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("部分失败显示警告色且合并同原因行号", () => {
    render(
      <DataImportExecutionStatus
        result={{ ...baseResult, failureCount: 2, details: failedDetails }}
      />,
    );
    expect(screen.getByText("已导入 3 笔，2 笔未导入")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveClass("MuiAlert-colorWarning");
    expect(screen.getByText("第 2、3、5 行：账户已归档。")).toBeInTheDocument();
  });

  it("导入失败原因超过二十组时限制展示并提示剩余数量", () => {
    const details = Array.from({ length: 22 }, (_, index) => ({
      reason: `账户 ${index + 1} 无法导入。`,
      rowNumbers: [index + 2],
      sheet: "incomeExpense" as const,
      status: "failed" as const,
    }));
    render(
      <DataImportExecutionStatus
        result={{ ...baseResult, failureCount: details.length, details }}
      />,
    );
    expect(
      screen.getByText("第 21 行：账户 20 无法导入。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("第 22 行：账户 21 无法导入。"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("还有 2 处")).toBeInTheDocument();
  });

  it("全部失败显示错误色", () => {
    render(
      <DataImportExecutionStatus
        result={{
          ...baseResult,
          successCount: 0,
          failureCount: 2,
          details: failedDetails,
        }}
      />,
    );
    expect(screen.getByText("没有导入任何记录")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveClass("MuiAlert-colorError");
  });

  it("新建待邀请成员时展示人数", () => {
    render(
      <DataImportExecutionStatus
        result={{ ...baseResult, createdPlaceholderCount: 2 }}
      />,
    );
    expect(screen.getByText("新建了 2 位待邀请成员")).toBeInTheDocument();
  });

  it("保留未匹配持有人提示", () => {
    render(
      <DataImportExecutionStatus
        result={{
          ...baseResult,
          holderMissingCount: 1,
          details: [
            {
              sheet: "transfer",
              rowNumbers: [6],
              reason: "已按无持有人导入。",
              status: "holderMissing",
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("未匹配持有人 1 笔")).toBeInTheDocument();
    expect(screen.getByText("第 6 行：已按无持有人导入。")).toBeInTheDocument();
  });
});
