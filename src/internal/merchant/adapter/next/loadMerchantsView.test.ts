// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  getCurrentLedgerOrRedirect: vi.fn(),
  list: vi.fn(),
  loadPresets: vi.fn(),
}));

vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));
vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  getCurrentLedgerOrRedirect: mocks.getCurrentLedgerOrRedirect,
}));
vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));

import { loadMerchantsView } from "./loadMerchantsView";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const tagId = "00000000-0000-4000-8000-000000002001";

describe("loadMerchantsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentLedgerOrRedirect.mockResolvedValue({ id: ledgerId });
    mocks.createServerRequestDependencies.mockResolvedValue({});
    mocks.list.mockResolvedValue({
      canManageMerchants: true,
      merchants: [],
      selectedTag: null,
      tags: [],
    });
    mocks.createRequestContainer.mockReturnValue({
      merchant: {
        service: { list: mocks.list },
        presetService: { load: mocks.loadPresets },
      },
    });
  });

  it("校验标签 UUID 后直接调用请求级 Merchant Service", async () => {
    expect(
      await loadMerchantsView({ keyword: "LIFE", tagId }),
    ).not.toHaveProperty("presetOptions");
    expect(mocks.loadPresets).not.toHaveBeenCalled();
    expect(mocks.list).toHaveBeenCalledWith({
      keyword: "LIFE",
      ledgerId,
      tagId,
    });
  });

  it("非管理成员不读取预设添加上下文", async () => {
    mocks.list.mockResolvedValue({
      canManageMerchants: false,
      merchants: [],
      tags: [],
    });
    expect(await loadMerchantsView({})).not.toHaveProperty("presetOptions");
    expect(mocks.loadPresets).not.toHaveBeenCalled();
  });

  it("忽略非法标签查询参数", async () => {
    await loadMerchantsView({ tagId: "invalid" });
    expect(mocks.list).toHaveBeenCalledWith({
      keyword: "",
      ledgerId,
      tagId: null,
    });
  });
});
