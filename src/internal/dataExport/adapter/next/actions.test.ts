// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  getData: vi.fn(),
  requireLedger: vi.fn(),
  dependencies: vi.fn(),
  logger: { error: vi.fn() },
}));
vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  requireCurrentUserAndLedger: mocks.requireLedger,
}));
vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.dependencies,
}));
vi.mock("internal/container", () => ({
  createRequestContainer: () => ({
    dataExport: { service: { getData: mocks.getData } },
  }),
}));
import { exportCurrentLedgerData } from "./actions";
import { dataExportErrorMessages } from "internal/dataExport";
import { RepositoryError } from "internal/shared/errors/appError";
import { createEmptyDataExport } from "test/mocks/dataExport";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireLedger.mockResolvedValue({
    currentLedger: { id: "server-ledger" },
    userId: "server-user",
  });
  mocks.dependencies.mockResolvedValue({ logger: mocks.logger });
  mocks.getData.mockResolvedValue(createEmptyDataExport());
});
describe("exportCurrentLedgerData", () => {
  it("每次调用重新认证且只使用服务端当前账本与用户", async () => {
    await expect(exportCurrentLedgerData()).resolves.toEqual({
      data: createEmptyDataExport(),
    });
    await exportCurrentLedgerData();
    expect(mocks.requireLedger).toHaveBeenCalledTimes(2);
    expect(mocks.getData).toHaveBeenCalledWith({
      ledgerId: "server-ledger",
      userId: "server-user",
    });
  });
  it("认证失败时不读取导出数据", async () => {
    mocks.requireLedger.mockRejectedValueOnce(new Error("需要登录"));
    await expect(exportCurrentLedgerData()).rejects.toThrow("需要登录");
    expect(mocks.getData).not.toHaveBeenCalled();
  });
  it("应用错误返回安全 inline state，连续失败有不同反馈标识", async () => {
    mocks.getData.mockRejectedValue(
      new RepositoryError("read_failed", "读取失败，请重试。"),
    );
    const first = await exportCurrentLedgerData();
    const second = await exportCurrentLedgerData();
    expect(first).toEqual({
      error: "读取失败，请重试。",
      errorKey: expect.any(String),
    });
    expect(second.errorKey).not.toBe(first.errorKey);
  });
  it("未知异常只记录安全上下文，不泄露原始错误", async () => {
    mocks.getData.mockRejectedValue(new Error("private SQL password"));
    expect(await exportCurrentLedgerData()).toEqual({
      error: dataExportErrorMessages.exportFailed,
      errorKey: expect.any(String),
    });
    expect(mocks.logger.error).toHaveBeenCalledWith(expect.any(String), {
      errorName: "Error",
      ledgerId: "server-ledger",
    });
  });
});
