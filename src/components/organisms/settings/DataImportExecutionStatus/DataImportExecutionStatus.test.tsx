import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { dataImportExecutionErrorMessages } from "internal/dataImport";

import { DataImportExecutionStatus } from "./DataImportExecutionStatus";

const baseResult = {
  details: [],
  failureCount: 0,
  createdPlaceholderCount: 0,
  holderMissingCount: 0,
  processedCount: 3,
  successCount: 3,
  totalCount: 10,
};

describe("DataImportExecutionStatus", () => {
  it("导入中展示保持页面打开的提示，不展示计数与明细", () => {
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

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(
      screen.getByText("导入需要一些时间，请保持页面打开，不要离开。"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/已处理/)).not.toBeInTheDocument();
    expect(screen.queryByText(/成功导入/)).not.toBeInTheDocument();
    expect(screen.queryByText("失败的记录")).not.toBeInTheDocument();
  });

  it("上传阶段显示真实照片数量，完成后不再显示", () => {
    const { rerender } = render(
      <DataImportExecutionStatus
        photoUploadProgress={{ done: 12, total: 80 }}
        result={baseResult}
        status="importing"
      />,
    );
    expect(screen.getByText("正在上传照片 12/80")).toBeInTheDocument();
    rerender(
      <DataImportExecutionStatus result={baseResult} status="importing" />,
    );
    expect(screen.queryByText(/正在上传照片/)).not.toBeInTheDocument();
  });

  it("完成态不再展示进度条与保持页面打开的提示", () => {
    render(
      <DataImportExecutionStatus
        result={{ ...baseResult, processedCount: 10, successCount: 10 }}
        status="completed"
      />,
    );

    expect(screen.getByText("成功导入 10 条")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(
      screen.queryByText("导入需要一些时间，请保持页面打开，不要离开。"),
    ).not.toBeInTheDocument();
  });

  it("全部成功时展示成功汇总", () => {
    render(
      <DataImportExecutionStatus
        result={{ ...baseResult, processedCount: 10, successCount: 10 }}
        status="completed"
      />,
    );

    expect(screen.getByText("导入完成")).toBeInTheDocument();
    expect(screen.getByText("成功导入 10 条")).toBeInTheDocument();
    expect(screen.queryByText(/待邀请成员/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "下载导入结果文件" })).not.toBeInTheDocument();
  });

  it("导入时新建了待邀请成员时展示新建人数", () => {
    render(
      <DataImportExecutionStatus
        result={{
          ...baseResult,
          createdPlaceholderCount: 2,
          processedCount: 10,
          successCount: 10,
        }}
        status="completed"
      />,
    );

    expect(screen.getByText("新建了 2 位待邀请成员")).toBeInTheDocument();
  });

  it("完成后一次性展示失败明细", () => {
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
          ],
          failureCount: 1,
          processedCount: 3,
          successCount: 2,
          totalCount: 3,
        }}
        status="completed"
      />,
    );

    expect(screen.getByText("失败 1 条")).toBeInTheDocument();
    expect(screen.getByText("失败的记录")).toBeInTheDocument();
    expect(screen.getByText(/第 2 行/)).toBeInTheDocument();
  });

  it("完成后展示未匹配持有人的记录且计入警告统计", () => {
    render(
      <DataImportExecutionStatus
        result={{
          ...baseResult,
          details: [
            {
              content: "2026-09-17 全家便利店 600",
              reason:
                dataImportExecutionErrorMessages.holderMissingWarning("小明"),
              rowNumbers: [6],
              sheet: "incomeExpense",
              status: "holderMissing",
            },
          ],
          createdPlaceholderCount: 0,
          holderMissingCount: 1,
          processedCount: 3,
          successCount: 3,
          totalCount: 3,
        }}
        status="completed"
      />,
    );

    expect(screen.getByText("未匹配持有人 1 条")).toBeInTheDocument();
    expect(screen.getByText("未匹配持有人的记录")).toBeInTheDocument();
    expect(screen.getByText(/第 6 行/)).toBeInTheDocument();
    expect(screen.queryByText("失败的记录")).not.toBeInTheDocument();
  });

  it("只有其中一类明细时不展示另一类标题", () => {
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
          ],
          failureCount: 1,
          processedCount: 3,
          successCount: 2,
          totalCount: 3,
        }}
        status="completed"
      />,
    );

    expect(screen.getByText("失败的记录")).toBeInTheDocument();
  });
});
