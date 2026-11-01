// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadAccountCreateView,
  loadAccountEditView,
  loadAccountsView,
} from "internal/account/adapter/next/loadAccountsView";

const mocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  getCurrentLedgerContext: vi.fn(),
  getView: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
}));
vi.mock("internal/ledger/adapter/next/currentLedgerContext", () => ({
  getCurrentLedgerContext: mocks.getCurrentLedgerContext,
}));
vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));
vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const accountId = "00000000-0000-4000-8000-000000000033";

function mockCurrentLedger() {
  vi.clearAllMocks();
  mocks.getCurrentLedgerContext.mockResolvedValue({
    currentLedger: {
      baseCurrency: "JPY",
      currentUserRole: "owner",
      id: ledgerId,
      name: "家庭账本",
    },
    userId,
  });
  mocks.createServerRequestDependencies.mockResolvedValue({});
  mocks.createRequestContainer.mockReturnValue({
    account: { service: { getView: mocks.getView } },
  });
}

const manageableView = {
  accounts: [{ id: accountId, name: "钱包现金" }],
  baseCurrency: "JPY",
  canManageAccounts: true,
  canWriteTransactions: true,
  holderOptions: [],
  ledgerName: "家庭账本",
  placeholderHolderOptions: [],
};

const accountFormView = {
  baseCurrency: "JPY",
  canWriteTransactions: true,
  holderOptions: [],
  ledgerName: "家庭账本",
  placeholderHolderOptions: [],
};

describe("loadAccountsView", () => {
  beforeEach(mockCurrentLedger);

  it("SSR 直接复用 Account Service 且不请求内部 API", async () => {
    const view = {
      accounts: [],
      baseCurrency: "JPY",
      canManageAccounts: true,
      canWriteTransactions: true,
      holderOptions: [],
      ledgerName: "家庭账本",
    };
    mocks.getView.mockResolvedValue(view);
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(loadAccountsView()).resolves.toEqual(view);

    expect(mocks.createServerRequestDependencies).toHaveBeenCalledTimes(1);
    expect(mocks.createRequestContainer).toHaveBeenCalledTimes(1);
    expect(mocks.getView).toHaveBeenCalledWith({ ledgerId, userId });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("没有 current ledger 时由页面边界跳回 Dashboard", async () => {
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: null,
      userId,
    });

    await expect(loadAccountsView()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(mocks.createServerRequestDependencies).not.toHaveBeenCalled();
    expect(mocks.getView).not.toHaveBeenCalled();
  });
});

describe("loadAccountCreateView", () => {
  beforeEach(mockCurrentLedger);

  it("只返回新增表单需要的内容", async () => {
    mocks.getView.mockResolvedValue(manageableView);

    await expect(loadAccountCreateView()).resolves.toEqual(accountFormView);
  });

  it("没有管理权限时回到账户管理页", async () => {
    mocks.getView.mockResolvedValue({
      ...manageableView,
      canManageAccounts: false,
    });

    await expect(loadAccountCreateView()).rejects.toThrow(
      "NEXT_REDIRECT:/accounts",
    );
  });
});

describe("loadAccountEditView", () => {
  beforeEach(mockCurrentLedger);

  it("返回编辑表单需要的内容与该账户", async () => {
    mocks.getView.mockResolvedValue(manageableView);

    await expect(loadAccountEditView(accountId)).resolves.toEqual({
      ...accountFormView,
      account: manageableView.accounts[0],
    });
  });

  it("没有管理权限时回到账户管理页", async () => {
    mocks.getView.mockResolvedValue({
      ...manageableView,
      canManageAccounts: false,
    });

    await expect(loadAccountEditView(accountId)).rejects.toThrow(
      "NEXT_REDIRECT:/accounts",
    );
  });

  it("当前账本没有这个使用中的账户时显示 404", async () => {
    mocks.getView.mockResolvedValue({ ...manageableView, accounts: [] });

    await expect(loadAccountEditView(accountId)).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("账户 ID 不是 UUID 时不读取数据直接显示 404", async () => {
    await expect(loadAccountEditView("not-a-uuid")).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(mocks.getView).not.toHaveBeenCalled();
  });
});
