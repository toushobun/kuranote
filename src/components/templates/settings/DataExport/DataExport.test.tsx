import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dataExportErrorMessages } from "internal/dataExport";
import { createEmptyDataExport } from "test/mocks/dataExport";
import type { DataExportAction } from "types/dataExport";
import { DataExportTemplate } from "./DataExport";

const buildWorkbook = vi.hoisted(() => vi.fn());
vi.mock("utils/dataExportWorkbook", () => ({
  buildDataExportWorkbook: buildWorkbook,
}));
const createObjectURL = vi.fn();
const revokeObjectURL = vi.fn();

beforeEach(() => {
  buildWorkbook.mockReset().mockResolvedValue(new ArrayBuffer(8));
  createObjectURL.mockReset().mockReturnValue("blob:export");
  revokeObjectURL.mockReset();
  vi.stubGlobal(
    "URL",
    Object.assign(URL, { createObjectURL, revokeObjectURL }),
  );
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function startExport(action: DataExportAction) {
  render(<DataExportTemplate exportAction={action} />);
  fireEvent.click(screen.getByRole("button", { name: "导出 xlsx" }));
}

describe("DataExportTemplate", () => {
  it("展示导出范围、格式与返回入口", () => {
    render(<DataExportTemplate exportAction={async () => ({})} />);
    expect(
      screen.getByRole("heading", { name: "数据导出" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "返回数据导入导出" }),
    ).toHaveAttribute("href", "/settings/data");
    expect(
      screen.getByText(/包含全部收支、转账和余额变更/),
    ).toBeInTheDocument();
  });
  it("导出期间禁用按钮并阻止重复请求", () => {
    const action = vi.fn(
      () => new Promise<Awaited<ReturnType<DataExportAction>>>(() => {}),
    );
    startExport(action);
    const button = screen.getByRole("button", { name: "正在导出…" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
  it("空账本成功生成文件、触发下载并延后回收 Blob URL", async () => {
    vi.useFakeTimers();
    startExport(async () => ({ data: createEmptyDataExport() }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(buildWorkbook).toHaveBeenCalledWith(createEmptyDataExport());
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(
      screen.getByText("导出文件已生成，已开始下载。"),
    ).toBeInTheDocument();
    expect(revokeObjectURL).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:export");
    expect(document.querySelector("a[download]")).toBeNull();
  });
  it("服务端失败通过统一反馈显示，关闭后可重试", async () => {
    startExport(async () => ({ error: "账本无法访问", errorKey: "one" }));
    expect(await screen.findByText("账本无法访问")).toBeInTheDocument();
    expect(buildWorkbook).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    await waitFor(() =>
      expect(screen.queryByText("账本无法访问")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "导出 xlsx" })).toBeEnabled();
  });
  it("文件生成异常不会下载，显示安全文案并恢复按钮", async () => {
    buildWorkbook.mockRejectedValueOnce(new Error("private internal failure"));
    startExport(async () => ({ data: createEmptyDataExport() }));
    expect(
      await screen.findByText(dataExportErrorMessages.downloadFailed),
    ).toBeInTheDocument();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "导出 xlsx" })).toBeEnabled();
  });
});
