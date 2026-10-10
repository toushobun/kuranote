// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteLedger } from "./ledgerDeletion";
import { AuthorizationError } from "internal/shared/errors/appError";
import { routePaths } from "config/paths";

const mocks = vi.hoisted(() => ({
  dependencies: vi.fn(),
  remove: vi.fn(),
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
    ledger: { settingsService: { deleteLedger: mocks.remove } },
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
