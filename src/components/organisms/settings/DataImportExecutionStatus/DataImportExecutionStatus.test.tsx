import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DataImportExecutionStatus } from "./DataImportExecutionStatus";

const baseResult = {
  details: [],
  duplicateCount: 0,
  failureCount: 0,
  processedCount: 3,
  rowResults: [],
  successCount: 3,
  totalCount: 10,
};

describe("DataImportExecutionStatus", () => {
  it("导入中展示真实处理进度且不提前展示明细", () => {
    render(
      <DataImportExecutionStatus
        result={{
          ...baseResult,
          details: [
            {
              content: "测试",
              reason: "测试原因",
              rowNumbers: [2],
              sheet: "incomeExpense",
              status: "failed",
            },
          ],
        }}
        status="importing"
      />,
    );

    expect(screen.getByText("已处理 3 / 共 10 条")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "30",
    );
    expect(screen.queryByText("需要确认的记录")).not.toBeInTheDocument();
  });

  it("全部成功时展示成功汇总与下载按钮", () => {
    const onDownload = vi.fn();
    render(
      <DataImportExecutionStatus
        onDownload={onDownload}
        result={{ ...baseResult, processedCount: 10, successCount: 10 }}
        status="completed"
      />,
    );

    expect(screen.getByText("导入完成")).toBeInTheDocument();
    expect(screen.getByText("成功导入 10 条")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "下载导入结果文件" }));
    expect(onDownload).toHaveBeenCalledOnce();
  });

  it("完成后一次性展示失败与疑似重复明细", () => {
    render(
      <DataImportExecutionStatus
        result={{
          ...baseResult,
          details: [
            {
              content: "2026-09-17 商家A 1000",
              reason: "数据库写入失败。",
              rowNumbers: [2],
              sheet: "incomeExpense",
              status: "failed",
            },
            {
              content: "2026-09-17 钱包 → 银行卡 5000",
              reason: "疑似与现有记录重复，但已继续导入。",
              rowNumbers: [4],
              sheet: "transfer",
              status: "duplicate",
            },
          ],
          duplicateCount: 1,
          failureCount: 1,
          processedCount: 3,
          successCount: 2,
          totalCount: 3,
        }}
        status="completed"
      />,
    );

    expect(screen.getByText("失败 1 条")).toBeInTheDocument();
    expect(screen.getByText("疑似重复 1 条")).toBeInTheDocument();
    expect(screen.getByText("需要确认的记录")).toBeInTheDocument();
    expect(screen.getByText(/第 2 行.*失败/)).toBeInTheDocument();
    expect(screen.getByText(/第 4 行.*疑似重复/)).toBeInTheDocument();
  });
});
