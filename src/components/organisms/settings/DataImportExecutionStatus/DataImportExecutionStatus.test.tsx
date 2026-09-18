import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DataImportExecutionStatus } from "./DataImportExecutionStatus";

const baseResult = {
  details: [],
  duplicateCount: 0,
  failureCount: 0,
  holderMissingCount: 0,
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
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "已处理 3 / 共 10 条",
    );
    expect(screen.queryByText("失败的记录")).not.toBeInTheDocument();
  });

  it("传入 displayProgress 时驱动进度条视觉值，但文案仍展示真实进度", () => {
    render(
      <DataImportExecutionStatus
        displayProgress={62}
        result={baseResult}
        status="importing"
      />,
    );

    expect(screen.getByText("已处理 3 / 共 10 条")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "62",
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "已处理 3 / 共 10 条",
    );
  });

  it("完成态进度条固定展示 100，不受 displayProgress 影响", () => {
    render(
      <DataImportExecutionStatus
        displayProgress={62}
        result={{ ...baseResult, processedCount: 10, successCount: 10 }}
        status="completed"
      />,
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
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
    expect(screen.getByText("失败的记录")).toBeInTheDocument();
    expect(screen.getByText("疑似重复的记录")).toBeInTheDocument();
    expect(screen.getByText(/第 2 行/)).toBeInTheDocument();
    expect(screen.getByText(/第 4 行/)).toBeInTheDocument();
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
                "账本内找不到显示名为「小明」的有效成员，已按无持有人继续导入该笔记录。",
              rowNumbers: [6],
              sheet: "incomeExpense",
              status: "holderMissing",
            },
          ],
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
    expect(screen.queryByText("疑似重复的记录")).not.toBeInTheDocument();
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
    expect(screen.queryByText("疑似重复的记录")).not.toBeInTheDocument();
  });
});
