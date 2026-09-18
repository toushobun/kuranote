import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type {
  DataImportActionState,
  DataImportBatchActionState,
  DataImportBatchStateAction,
  DataImportStateAction,
} from "types/dataImport";
import { DataImportTemplate } from "./DataImport";

function selectFile(name = "data.xlsx") {
  const input = screen.getByLabelText("选择文件") as HTMLInputElement;
  const file = new File(["binary"], name);
  fireEvent.change(input, { target: { files: [file] } });
  return file;
}

function renderTemplate({
  checkFormatAction = vi.fn(async (): Promise<DataImportActionState> => ({})),
  executeBatchAction = vi.fn(
    async (): Promise<DataImportBatchActionState> => ({}),
  ),
}: {
  checkFormatAction?: DataImportStateAction;
  executeBatchAction?: DataImportBatchStateAction;
} = {}) {
  return render(
    <DataImportTemplate
      checkFormatAction={checkFormatAction}
      executeBatchAction={executeBatchAction}
    />,
  );
}

describe("DataImportTemplate", () => {
  it("展示标题、返回入口与格式说明", () => {
    renderTemplate();

    expect(
      screen.getByRole("heading", { name: "数据导入" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "返回数据导入导出" }),
    ).toHaveAttribute("href", "/settings/data");
    expect(screen.getByText("文件格式要求")).toBeInTheDocument();
    expect(screen.getByText("账户*")).toBeInTheDocument();
    expect(screen.getByText("转出账户*")).toBeInTheDocument();
  });

  it("未选择文件时提交按钮禁用", () => {
    renderTemplate();
    expect(screen.getByRole("button", { name: "检查格式" })).toBeDisabled();
  });

  it("选择文件后展示文件名并启用提交按钮", () => {
    renderTemplate();
    selectFile("income.xlsx");
    expect(screen.getByText("income.xlsx")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "检查格式" })).not.toBeDisabled();
  });

  it("检查格式调用 Server Action 并展示错误状态", async () => {
    const action = vi.fn(
      async (): Promise<DataImportActionState> => ({
        error: "仅支持 xlsx 文件。",
        errorKey: "err-1",
      }),
    );
    renderTemplate({ checkFormatAction: action });
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "检查格式" }));

    expect(await screen.findByText("仅支持 xlsx 文件。")).toBeInTheDocument();
    expect(action).toHaveBeenCalledOnce();
  });

  it("校验通过时展示成功统计与开始导入按钮", async () => {
    const action = vi.fn(
      async (): Promise<DataImportActionState> => ({
        result: {
          ok: true,
          summary: {
            balanceAdjustmentDetected: true,
            incomeExpenseCount: 3,
            transferCount: 1,
          },
        },
      }),
    );
    renderTemplate({ checkFormatAction: action });
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "检查格式" }));

    expect(await screen.findByText("格式检查通过")).toBeInTheDocument();
    expect(screen.getByText(/收支记录 3 笔/)).toBeInTheDocument();
    expect(screen.getByText(/转账记录 1 笔/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "开始导入" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("另识别到「余额变更」表，本期暂不支持导入，已跳过。"),
    ).toBeInTheDocument();
  });

  it("开始导入后调用批处理 Action 并展示完成汇总", async () => {
    const checkAction = vi.fn(
      async (): Promise<DataImportActionState> => ({
        result: {
          ok: true,
          summary: {
            balanceAdjustmentDetected: false,
            incomeExpenseCount: 1,
            transferCount: 0,
          },
        },
      }),
    );
    const executeAction = vi.fn(
      async (): Promise<DataImportBatchActionState> => ({
        batch: {
          details: [],
          done: true,
          duplicateCount: 0,
          failureCount: 0,
          holderMissingCount: 0,
          nextOffset: 1,
          processedCount: 1,
          rowResults: [
            {
              reason: null,
              rowNumber: 2,
              sheet: "incomeExpense",
              status: "success",
            },
          ],
          successCount: 1,
          totalCount: 1,
        },
      }),
    );
    renderTemplate({
      checkFormatAction: checkAction,
      executeBatchAction: executeAction,
    });
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "检查格式" }));
    fireEvent.click(await screen.findByRole("button", { name: "开始导入" }));

    expect(await screen.findByText("导入完成")).toBeInTheDocument();
    expect(screen.getByText("已处理 1 / 共 1 条")).toBeInTheDocument();
    expect(screen.getByText("成功导入 1 条")).toBeInTheDocument();
    expect(executeAction).toHaveBeenCalledOnce();
  });

  it("批处理出错后重置导入状态，检查格式与开始导入按钮恢复可用", async () => {
    const checkAction = vi.fn(
      async (): Promise<DataImportActionState> => ({
        result: {
          ok: true,
          summary: {
            balanceAdjustmentDetected: false,
            incomeExpenseCount: 1,
            transferCount: 0,
          },
        },
      }),
    );
    const executeAction = vi.fn(
      async (): Promise<DataImportBatchActionState> => ({
        error: "登录状态已失效，请重新登录后再试。",
      }),
    );
    renderTemplate({
      checkFormatAction: checkAction,
      executeBatchAction: executeAction,
    });
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "检查格式" }));
    fireEvent.click(await screen.findByRole("button", { name: "开始导入" }));

    expect(
      await screen.findByText("登录状态已失效，请重新登录后再试。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "检查格式" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "开始导入" })).not.toBeDisabled();
  });

  it("校验未通过时展示每一条错误", async () => {
    const action = vi.fn(
      async (): Promise<DataImportActionState> => ({
        result: {
          issues: [
            { kind: "structural", message: "文件为空或没有可识别的数据表。" },
            {
              column: "金额",
              kind: "row",
              message: "金额必须是不超过两位小数的非负数字。",
              rowNumber: 3,
              sheet: "incomeExpense",
            },
          ],
          ok: false,
        },
      }),
    );
    renderTemplate({ checkFormatAction: action });
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "检查格式" }));

    expect(await screen.findByText("格式检查未通过")).toBeInTheDocument();
    expect(
      screen.getByText("文件为空或没有可识别的数据表。"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/第 3 行.*金额.*金额必须是不超过两位小数的非负数字。/),
    ).toBeInTheDocument();
  });
});
