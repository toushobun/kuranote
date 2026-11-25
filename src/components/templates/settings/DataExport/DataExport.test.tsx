import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AccountSeparatorDataExportError,
  dataExportErrorMessages,
} from "internal/dataExport";
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
    class extends URL {
      static createObjectURL = createObjectURL;
      static revokeObjectURL = revokeObjectURL;
    },
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
  fireEvent.click(screen.getByRole("button", { name: "导出 Excel" }));
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
  it("默认关闭照片开关，开启后展示大文件提示并把选项传给服务端", async () => {
    const action = vi.fn().mockResolvedValue({ data: createEmptyDataExport() });
    render(<DataExportTemplate exportAction={action} />);
    const toggle = screen.getByRole("switch", { name: "导出照片" });
    expect(toggle).not.toBeChecked();
    fireEvent.click(toggle);
    expect(screen.getByText(/文件较大/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "导出 Excel" }));
    await waitFor(() =>
      expect(action).toHaveBeenCalledWith({
        includePhotos: true,
        recordTypes: ["normal", "transfer", "balance_adjustment"],
      }),
    );
    expect(buildWorkbook).toHaveBeenCalledWith(
      createEmptyDataExport(),
      expect.objectContaining({ onPhotoProgress: expect.any(Function) }),
    );
  });
  it("取消全部记录类型时禁止导出", () => {
    render(<DataExportTemplate exportAction={async () => ({})} />);
    for (const name of ["收支", "转账", "余额变更"]) {
      fireEvent.click(screen.getByRole("checkbox", { name }));
    }
    expect(screen.getByRole("button", { name: "导出 Excel" })).toBeDisabled();
  });
  it("日期按设备自然日计算，结束日全天包含", async () => {
    const action = vi.fn().mockResolvedValue({ data: createEmptyDataExport() });
    render(<DataExportTemplate exportAction={action} />);
    fireEvent.click(screen.getByRole("button", { name: /日期区间/ }));
    fireEvent.change(screen.getByLabelText("开始日期"), {
      target: { value: "2026-11-25" },
    });
    fireEvent.change(screen.getByLabelText("结束日期"), {
      target: { value: "2026-11-25" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "转账" }));
    fireEvent.click(screen.getByRole("button", { name: "导出 Excel" }));
    await waitFor(() =>
      expect(action).toHaveBeenCalledWith({
        includePhotos: false,
        recordTypes: ["normal", "balance_adjustment"],
        dateStart: new Date(2026, 10, 25).toISOString(),
        dateEnd: new Date(2026, 10, 26).toISOString(),
      }),
    );
  });
  it("导出期间禁用按钮并阻止重复请求", async () => {
    const action = vi.fn(
      () => new Promise<Awaited<ReturnType<DataExportAction>>>(() => {}),
    );
    startExport(action);
    const button = screen.getByRole("button", { name: "导出中…" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(action).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByRole("progressbar")).toBeInTheDocument();
  });
  it("空账本成功生成文件、触发下载并延后回收 Blob URL", async () => {
    // 其他测试留下的真实定时器可能同时触发，使用独有 URL 避免串扰。
    createObjectURL.mockReturnValue("blob:export-current-test");
    vi.useFakeTimers();
    startExport(async () => ({ data: createEmptyDataExport() }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(buildWorkbook).toHaveBeenCalledWith(createEmptyDataExport());
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(screen.getByText(/已开始下载 KuraNote-/)).toBeInTheDocument();
    expect(revokeObjectURL).not.toHaveBeenCalledWith(
      "blob:export-current-test",
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:export-current-test");
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
    expect(screen.getByRole("button", { name: "导出 Excel" })).toBeEnabled();
  });
  it("账户名称包含分号时展示具体原因并阻止下载", async () => {
    buildWorkbook.mockRejectedValueOnce(new AccountSeparatorDataExportError());
    startExport(async () => ({ data: createEmptyDataExport() }));
    expect(
      await screen.findByText(dataExportErrorMessages.accountSeparator),
    ).toBeInTheDocument();
    expect(createObjectURL).not.toHaveBeenCalled();
  });
  it("文件生成异常不会下载，显示安全文案并恢复按钮", async () => {
    buildWorkbook.mockRejectedValueOnce(new Error("private internal failure"));
    startExport(async () => ({ data: createEmptyDataExport() }));
    expect(
      await screen.findByText(dataExportErrorMessages.downloadFailed),
    ).toBeInTheDocument();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "导出 Excel" })).toBeEnabled();
  });
});
