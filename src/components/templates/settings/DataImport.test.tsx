import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ImportValidationResult } from "internal/dataImport";
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
    expect(screen.getByText("文件格式要求")).toBeInTheDocument();
    expect(screen.getAllByText("账户*")).toHaveLength(2);
    expect(screen.getByText("转出账户*")).toBeInTheDocument();
    expect(
      screen.getByText("「余额变更」表列名（*为必填）"),
    ).toBeInTheDocument();
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

  it("检查格式在浏览器端解析文件，解析异常时展示错误提示", async () => {
    analyzeImportFileMock.mockRejectedValue(new Error("out of memory"));
    const executeAction = vi.fn(
      async (): Promise<DataImportBatchActionState> => ({}),
    );
    renderTemplate({ executeBatchAction: executeAction });
    const file = selectFile();
    fireEvent.click(screen.getByRole("button", { name: "检查格式" }));

    expect(
      await screen.findByText("文件检查失败，请稍后重试。"),
    ).toBeInTheDocument();
    expect(analyzeImportFileMock).toHaveBeenCalledWith(file);
    expect(executeAction).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "检查格式" })).not.toBeDisabled();
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
    fireEvent.click(screen.getByRole("button", { name: "检查格式" }));

    expect(await screen.findByText("格式检查通过")).toBeInTheDocument();
    expect(screen.getByText(/收支记录 3 笔/)).toBeInTheDocument();
    expect(screen.getByText(/转账记录 1 笔/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "开始导入" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/余额变更记录 1 笔/)).toBeInTheDocument();
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
          duplicateCount: 0,
          failureCount: 0,
          holderMissingCount: 0,
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
        },
      }),
    );
    renderTemplate({ executeBatchAction: executeAction });
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "检查格式" }));
    fireEvent.click(await screen.findByRole("button", { name: "开始导入" }));

    expect(await screen.findByText("导入完成")).toBeInTheDocument();
    expect(screen.getByText("成功导入 1 条")).toBeInTheDocument();
    expect(executeAction).toHaveBeenCalledOnce();
  });

  it("批处理出错后重置导入状态，检查格式与开始导入按钮恢复可用", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: "检查格式" }));
    fireEvent.click(await screen.findByRole("button", { name: "开始导入" }));

    expect(
      await screen.findByText("登录状态已失效，请重新登录后再试。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "检查格式" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "开始导入" })).not.toBeDisabled();
  });

  it("校验未通过时展示每一条错误", async () => {
    mockValidationResult({
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
    });
    renderTemplate();
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

  describe("持有人映射步骤", () => {
    function makeSingleBatch() {
      return {
        createdPlaceholderCount: 0,
        details: [],
        duplicateCount: 0,
        failureCount: 0,
        holderMissingCount: 0,
        processedCount: 1,
        rowResults: [],
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
      fireEvent.click(screen.getByRole("button", { name: "检查格式" }));
      await screen.findByText("格式检查通过");
      return executeBatchAction;
    }

    it("存在未匹配持有人时展示映射步骤并替换开始导入按钮", async () => {
      await checkFormatWithHolder("小明");

      expect(
        screen.getByRole("group", { name: "「小明」" }),
      ).toBeInTheDocument();
      expect(screen.getByText("涉及 1 条记录")).toBeInTheDocument();
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

      expect(await screen.findByText("导入完成")).toBeInTheDocument();
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
      expect(screen.queryByText("格式检查通过")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "检查格式" }),
      ).not.toBeDisabled();
      expect(executeAction).not.toHaveBeenCalled();
    });
  });
});
