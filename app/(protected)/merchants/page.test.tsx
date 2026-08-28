import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  getCurrentLedgerOrRedirect: vi.fn(),
  getView: vi.fn(),
  MerchantsTemplate: vi.fn(() => null),
}));

vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  getCurrentLedgerOrRedirect: mocks.getCurrentLedgerOrRedirect,
}));
vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));
vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));
vi.mock("templates/merchants/Merchants", () => ({
  MerchantsTemplate: mocks.MerchantsTemplate,
}));

import MerchantsPage from "./page";

const ledgerId = "00000000-0000-4000-8000-000000000032";

describe("MerchantsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentLedgerOrRedirect.mockResolvedValue({
      currentUserRole: "owner",
      id: ledgerId,
      name: "家庭账本",
    });
    mocks.createServerRequestDependencies.mockResolvedValue({
      requestId: "req-1",
    });
    mocks.getView.mockResolvedValue({
      canManageMerchants: true,
      ledgerName: "家庭账本",
      merchants: [],
    });
    mocks.createRequestContainer.mockReturnValue({
      merchant: { service: { getView: mocks.getView } },
    });
  });

  it("SSR 直接调用 Request Container 的 Merchant Service，不请求内部 API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await MerchantsPage({
      searchParams: Promise.resolve({ q: " LIFE " }),
    });
    const element = result as ReactElement<Record<string, unknown>>;

    expect(mocks.createServerRequestDependencies).toHaveBeenCalledOnce();
    expect(mocks.createRequestContainer).toHaveBeenCalledOnce();
    expect(mocks.getView).toHaveBeenCalledWith({
      keyword: " LIFE ",
      ledgerId,
      ledgerName: "家庭账本",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(element.type).toBe(mocks.MerchantsTemplate);
  });

  it("只把搜索参数和视图数据传给列表模板", async () => {
    const result = await MerchantsPage({
      searchParams: Promise.resolve({
        error: "create_failed",
        merchantId: "merchant-1",
        q: "LIFE",
      }),
    });
    const element = result as ReactElement<Record<string, unknown>>;

    expect(element.props).toMatchObject({
      canManageMerchants: true,
      keyword: "LIFE",
      ledgerId,
      ledgerName: "家庭账本",
      merchants: [],
    });
    expect(element.props).not.toHaveProperty("errorMerchantId");
    expect(element.props).not.toHaveProperty("errorMessage");
  });
});
