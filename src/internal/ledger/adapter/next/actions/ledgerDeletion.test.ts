// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteLedger, loadLedgerDeletionImpact } from "./ledgerDeletion";
import {
  AuthorizationError,
  RepositoryError,
} from "internal/shared/errors/appError";
import { emptyLedgerDeletionImpact } from "test/ledgerDeletion";
import { routePaths } from "config/paths";

const mocks = vi.hoisted(() => ({
  dependencies: vi.fn(),
  remove: vi.fn(),
  impact: vi.fn(),
  revalidate: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.dependencies,
}));
vi.mock("internal/container", () => ({
  createRequestContainer: () => ({
    ledger: {
      settingsService: {
        deleteLedger: mocks.remove,
        getDeletionImpact: mocks.impact,
      },
    },
  }),
}));
vi.mock("internal/ledger/adapter/next/revalidateLedger", () => ({
  revalidateLedgerMutation: mocks.revalidate,
}));
const ledgerId = "00000000-0000-4000-8000-000000000032";
function form(id = ledgerId) {
  const data = new FormData();
  data.set("ledgerId", id);
  data.set("confirmationName", "家庭账本 ");
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.dependencies.mockResolvedValue({
    auth: { isAuthenticated: true, userId: "owner" },
  });
  mocks.remove.mockResolvedValue(undefined);
  mocks.impact.mockResolvedValue(emptyLedgerDeletionImpact);
});
describe("deleteLedger", () => {
  it("非法输入返回 inline 错误且不调用 Service", async () => {
    expect(await deleteLedger({}, form("bad"))).toEqual({
      error: "账本指定不正确。",
      errorKey: expect.any(String),
    });
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("未登录返回 inline 错误而非失败跳转", async () => {
    mocks.dependencies.mockResolvedValue({ auth: { isAuthenticated: false } });
    expect(await deleteLedger({}, form())).toMatchObject({
      errorKey: expect.any(String),
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("失败保留安全业务文案并生成新的错误标识", async () => {
    mocks.remove.mockRejectedValue(
      new AuthorizationError("ledger_delete_forbidden", "无权删除"),
    );
    const first = await deleteLedger({}, form());
    const second = await deleteLedger({}, form());
    expect(first).toEqual({ error: "无权删除", errorKey: expect.any(String) });
    expect(first.errorKey).not.toBe(second.errorKey);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("未知错误不泄露内部信息", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.remove.mockRejectedValue(new Error("SQL secret"));
    expect(await deleteLedger({}, form())).toMatchObject({
      error: "账本删除失败，请稍后重试。",
    });
    expect(log).toHaveBeenCalledWith(expect.any(String), {
      errorName: "Error",
    });
    log.mockRestore();
  });
  it("成功原样传递确认名并刷新后导航首页", async () => {
    await expect(deleteLedger({}, form())).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.remove).toHaveBeenCalledWith({
      ledgerId,
      userId: "owner",
      confirmationName: "家庭账本 ",
    });
    expect(mocks.revalidate).toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith(routePaths.dashboard);
  });
});
describe("loadLedgerDeletionImpact", () => {
  it("非法账本 ID 返回 inline 错误且不调用 Service", async () => {
    expect(await loadLedgerDeletionImpact("bad")).toEqual({
      error: "账本指定不正确。",
      errorKey: expect.any(String),
    });
    expect(mocks.impact).not.toHaveBeenCalled();
  });
  it("成功时返回影响统计", async () => {
    expect(await loadLedgerDeletionImpact(ledgerId)).toEqual({
      impact: emptyLedgerDeletionImpact,
    });
    expect(mocks.impact).toHaveBeenCalledWith({ ledgerId, userId: "owner" });
  });
  it("Service 失败时返回安全文案而不抛出", async () => {
    mocks.impact.mockRejectedValue(
      new RepositoryError("ledger_delete_impact_failed", "读取失败"),
    );
    expect(await loadLedgerDeletionImpact(ledgerId)).toEqual({
      error: "读取失败",
      errorKey: expect.any(String),
    });
  });
  it("未知错误返回影响读取的兜底文案", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.impact.mockRejectedValue(new Error("SQL secret"));
    expect(await loadLedgerDeletionImpact(ledgerId)).toMatchObject({
      error: "删除影响读取失败，请稍后重试。",
    });
    log.mockRestore();
  });
});
