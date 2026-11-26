import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  dataImportErrorCodes,
  dataImportErrorMessages,
  importStructuralErrorMessages,
  incomeExpenseImportErrorMessages,
  type ImportValidationResult,
} from "internal/dataImport";
import { makeAnalyzeImportFileResult } from "test/mocks/dataImport";
import type { DataImportBatchActionState } from "types/dataImport";
import { DataImportTemplate } from "./DataImport";

const analyzeImportFileMock = vi.hoisted(() => vi.fn());

vi.mock("internal/dataImport", async (importOriginal) => ({
  ...(await importOriginal<typeof import("internal/dataImport")>()),
  analyzeImportFile: analyzeImportFileMock,
}));

function mockValidationResult(result: ImportValidationResult) {
  analyzeImportFileMock.mockResolvedValue({
    result,
    units: result.ok ? makeAnalyzeImportFileResult(1).units : [],
  });
}

function selectFile(name = "data.xlsx") {
  const input = screen.getByLabelText("选择文件") as HTMLInputElement;
  const file = new File(["binary"], name);
  fireEvent.change(input, { target: { files: [file] } });
  return file;
}

function renderTemplate({
  executeBatchAction = vi.fn(
    async (): Promise<DataImportBatchActionState> => ({}),
  ),
  holderMembers = [],
  ...props
}: Partial<Parameters<typeof DataImportTemplate>[0]> = {}) {
  return render(
    <DataImportTemplate
      executeBatchAction={executeBatchAction}
      holderMembers={holderMembers}
      {...props}
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
    expect(screen.getByText("查看文件格式要求")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "查看文件格式要求" }),
    ).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByRole("button", { name: "查看文件格式要求" }));
    expect(screen.getAllByText("账户*")).toHaveLength(2);
    expect(screen.getByText("转出账户*")).toBeInTheDocument();
    expect(
      screen.getByText("「余额变更」表列名（*为必填）"),
    ).toBeInTheDocument();
  });

  it("说明「账户类型」列必填、可填写的值，并在各表列名中标为必填", () => {
    renderTemplate();
    fireEvent.click(screen.getByRole("button", { name: "查看文件格式要求" }));

    expect(
      screen.getByText(
        /「账户类型」列.*必填.*现金、银行卡、信用卡、电子钱包、其他/,
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("账户类型*")).toHaveLength(2);
    expect(screen.getByText("转出账户类型*")).toBeInTheDocument();
    expect(screen.getByText("转入账户类型*")).toBeInTheDocument();
  });

  it("未选择文件时只展示选文件入口", () => {
    renderTemplate();
    expect(screen.getByText("尚未选择文件")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "开始导入" }),
    ).not.toBeInTheDocument();
  });

  it("选择文件后立即自动检查并展示文件名和重新选择", () => {
    analyzeImportFileMock.mockImplementation(() => new Promise(() => {}));
    renderTemplate();
    const file = selectFile("income.xlsx");
    expect(screen.getByText("income.xlsx")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "正在检查…" }),
    ).toBeInTheDocument();
    expect(screen.getByText("重新选择")).toBeInTheDocument();
    expect(analyzeImportFileMock).toHaveBeenCalledWith(file);
  });

  it("检查格式在浏览器端解析文件，解析异常时展示错误提示", async () => {
    analyzeImportFileMock.mockRejectedValue(new Error("out of memory"));
    const executeAction = vi.fn(
      async (): Promise<DataImportBatchActionState> => ({}),
    );
    renderTemplate({ executeBatchAction: executeAction });
    const file = selectFile();

    expect(
      await screen.findByText(
        dataImportErrorMessages[dataImportErrorCodes.validationFailed],
      ),
    ).toBeInTheDocument();
    expect(analyzeImportFileMock).toHaveBeenCalledWith(file);
    expect(executeAction).not.toHaveBeenCalled();
    expect(screen.getByLabelText("选择文件")).not.toBeDisabled();
  });

  it("校验通过时展示成功统计与开始导入按钮", async () => {
    mockValidationResult({
      ok: true,
      summary: {
        balanceAdjustmentCount: 1,
        incomeExpenseCount: 3,
        transferCount: 1,
      },
    });
    renderTemplate();
    selectFile();

    expect(await screen.findByText("可以导入")).toBeInTheDocument();
    expect(screen.getByText(/收支 3 笔/)).toBeInTheDocument();
    expect(screen.getByText(/转账 1 笔/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "开始导入" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/余额变更 1 笔/)).toBeInTheDocument();
    expect(screen.queryByText(/暂不支持/)).not.toBeInTheDocument();
  });

  it("开始导入后调用批处理 Action 并展示完成汇总", async () => {
    mockValidationResult({
      ok: true,
      summary: {
        balanceAdjustmentCount: 0,
        incomeExpenseCount: 1,
        transferCount: 0,
      },
    });
    const executeAction = vi.fn(
      async (): Promise<DataImportBatchActionState> => ({
        batch: {
          createdPlaceholderCount: 0,
          details: [],
          failureCount: 0,
          holderMissingCount: 0,
          successCount: 1,
        },
      }),
    );
    renderTemplate({ executeBatchAction: executeAction });
    selectFile();
    fireEvent.click(await screen.findByRole("button", { name: "开始导入" }));

    expect(await screen.findByText("已导入 1 笔")).toBeInTheDocument();
    expect(screen.getByText("data.xlsx")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "开始导入" }),
    ).not.toBeInTheDocument();
    expect(executeAction).toHaveBeenCalledOnce();
  });

  it("批处理出错后重置导入状态，重新选择与开始导入按钮恢复可用", async () => {
    mockValidationResult({
      ok: true,
      summary: {
        balanceAdjustmentCount: 0,
        incomeExpenseCount: 1,
        transferCount: 0,
      },
    });
    const executeAction = vi.fn(
      async (): Promise<DataImportBatchActionState> => ({
        error: "登录状态已失效，请重新登录后再试。",
      }),
    );
    renderTemplate({ executeBatchAction: executeAction });
    selectFile();
    fireEvent.click(await screen.findByRole("button", { name: "开始导入" }));

    expect(
      await screen.findByText("登录状态已失效，请重新登录后再试。"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("选择文件")).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "开始导入" })).not.toBeDisabled();
  });

  it("校验未通过时展示每一条错误", async () => {
    mockValidationResult({
      issues: [
        {
          kind: "structural",
          message: importStructuralErrorMessages.workbookEmpty,
        },
        {
          column: "金额",
          kind: "row",
          message: incomeExpenseImportErrorMessages.amountInvalid,
          rowNumber: 3,
          sheet: "incomeExpense",
        },
      ],
      ok: false,
    });
    renderTemplate();
    selectFile();

    expect(await screen.findByText("有 2 处需要修改")).toBeInTheDocument();
    expect(
      screen.getByText(importStructuralErrorMessages.workbookEmpty),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(
          `第 3 行.*金额.*${incomeExpenseImportErrorMessages.amountInvalid}`,
        ),
      ),
    ).toBeInTheDocument();
  });

  it("检查失败时合并同类行号且只展示前二十组", async () => {
    mockValidationResult({
      ok: false,
      issues: [
        ...[2, 3, 5].map((rowNumber) => ({
          kind: "row" as const,
          sheet: "incomeExpense" as const,
          column: "金额",
          rowNumber,
          message: "金额错误。",
        })),
        ...Array.from({ length: 21 }, (_, index) => ({
          kind: "structural" as const,
          message: `结构错误 ${index + 1}。`,
        })),
      ],
    });
    renderTemplate();
    selectFile();
    expect(await screen.findByText("有 22 处需要修改")).toBeInTheDocument();
    expect(
      screen.getByText("第 2、3、5 行：「金额」金额错误。"),
    ).toBeInTheDocument();
    expect(screen.getByText("还有 2 处需要修改")).toBeInTheDocument();
    expect(screen.queryByText("结构错误 21。")).not.toBeInTheDocument();
    expect(screen.getByText("data.xlsx")).toBeInTheDocument();
    expect(screen.getByText("重新选择")).toBeInTheDocument();
  });

  it("导入中保留文件名、禁止重新选择并展示按钮处理状态", async () => {
    analyzeImportFileMock.mockResolvedValue(makeAnalyzeImportFileResult(1));
    renderTemplate({ executeBatchAction: () => new Promise(() => {}) });
    selectFile();
    fireEvent.click(await screen.findByRole("button", { name: "开始导入" }));
    expect(screen.getByText("data.xlsx")).toBeInTheDocument();
    expect(screen.getByLabelText("选择文件")).toBeDisabled();
    expect(screen.getByRole("button", { name: "正在导入…" })).toBeDisabled();
    expect(screen.getByText("请保持页面打开")).toBeInTheDocument();
  });

  describe("持有人映射步骤", () => {
    function makeSingleBatch() {
      return {
        createdPlaceholderCount: 0,
        details: [],
        failureCount: 0,
        holderMissingCount: 0,
        successCount: 1,
      };
    }

    const holderMembers = [{ displayName: "张三", userId: "user-1" }];

    async function checkFormatWithHolder(
      fromAccountHolder: string,
      executeBatchAction = vi.fn(
        async (): Promise<DataImportBatchActionState> => ({}),
      ),
      props: Partial<Parameters<typeof DataImportTemplate>[0]> = {},
    ) {
      const analyzed = makeAnalyzeImportFileResult(1, fromAccountHolder);
      analyzeImportFileMock.mockResolvedValue(analyzed);
      renderTemplate({ executeBatchAction, holderMembers, ...props });
      selectFile();
      await screen.findByText("可以导入");
      return executeBatchAction;
    }

    it("存在未匹配持有人时展示映射步骤并替换开始导入按钮", async () => {
      await checkFormatWithHolder("小明");

      expect(
        screen.getByRole("group", { name: "「小明」" }),
      ).toBeInTheDocument();
      expect(screen.getByText("涉及 1 条记录")).toBeInTheDocument();
      expect(
        screen.getByText("有 1 位持有人需要确认对应的成员"),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "开始导入" }),
      ).not.toBeInTheDocument();
    });

    it("持有人都能唯一匹配时跳过映射步骤", async () => {
      await checkFormatWithHolder("张三");

      expect(screen.queryByRole("group")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "开始导入" }),
      ).toBeInTheDocument();
    });

    it("继续导入时带着映射调用批处理 Action", async () => {
      const executeAction = vi.fn(
        async (): Promise<DataImportBatchActionState> => ({
          batch: makeSingleBatch(),
        }),
      );
      await checkFormatWithHolder("小明", executeAction);

      fireEvent.click(screen.getByRole("button", { name: "继续导入" }));

      expect(await screen.findByText("已导入 1 笔")).toBeInTheDocument();
      const formData = (
        executeAction.mock.calls[0] as unknown as [unknown, FormData]
      )[1];
      expect(formData.get("holderMapping")).toBe(
        JSON.stringify({ 小明: { kind: "none" } }),
      );
      expect(screen.queryByText(/新建了/)).not.toBeInTheDocument();
    });

    it("管理员选择新建待邀请成员后继续导入，完成后提示新建人数", async () => {
      const executeAction = vi.fn(
        async (): Promise<DataImportBatchActionState> => ({
          batch: { ...makeSingleBatch(), createdPlaceholderCount: 1 },
          resolvedHolderMapping: {
            小明: {
              kind: "placeholder",
              placeholderId: "00000000-0000-4000-8000-000000000051",
            },
          },
        }),
      );
      await checkFormatWithHolder("小明", executeAction, {
        canCreatePlaceholders: true,
        holderPlaceholders: [
          { displayName: "奶奶", id: "00000000-0000-4000-8000-000000000052" },
        ],
      });

      fireEvent.mouseDown(screen.getByRole("combobox"));
      fireEvent.click(
        screen.getByRole("option", { name: "新建待邀请成员「小明」" }),
      );
      expect(executeAction).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "继续导入" }));

      expect(
        await screen.findByText("新建了 1 位待邀请成员"),
      ).toBeInTheDocument();
      const formData = (
        executeAction.mock.calls[0] as unknown as [unknown, FormData]
      )[1];
      expect(formData.get("holderMapping")).toBe(
        JSON.stringify({
          小明: { displayName: "小明", kind: "newPlaceholder" },
        }),
      );
    });

    it("取消导入后回到选文件状态且不调用批处理 Action", async () => {
      const executeAction = await checkFormatWithHolder("小明");

      fireEvent.click(screen.getByRole("button", { name: "取消导入" }));

      expect(screen.queryByRole("group")).not.toBeInTheDocument();
      expect(screen.queryByText("可以导入")).not.toBeInTheDocument();
      expect(screen.getByText("data.xlsx")).toBeInTheDocument();
      expect(screen.getByLabelText("选择文件")).not.toBeDisabled();
      expect(executeAction).not.toHaveBeenCalled();
    });
  });
});
