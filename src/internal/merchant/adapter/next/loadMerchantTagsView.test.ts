// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  getCurrentLedgerOrRedirect: vi.fn(),
  listTags: vi.fn(),
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

import { loadMerchantTagsView } from "./loadMerchantTagsView";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const tags = [
  { icon: "🛒", id: "tag-1", merchant_count: 2, name: "超市", sort_order: 0 },
];

describe("loadMerchantTagsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentLedgerOrRedirect.mockResolvedValue({
      currentUserRole: "owner",
      id: ledgerId,
    });
    mocks.createServerRequestDependencies.mockResolvedValue({});
    mocks.listTags.mockResolvedValue(tags);
    mocks.createRequestContainer.mockReturnValue({
      merchant: { service: { listTags: mocks.listTags } },
    });
  });

  it("管理成员只读取当前账本的标签", async () => {
    await expect(loadMerchantTagsView()).resolves.toEqual({
      canManageMerchants: true,
      tags,
    });
    expect(mocks.listTags).toHaveBeenCalledWith({ ledgerId });
  });

  it("无管理权限时不读取标签", async () => {
    mocks.getCurrentLedgerOrRedirect.mockResolvedValue({
      currentUserRole: "viewer",
      id: ledgerId,
    });

    await expect(loadMerchantTagsView()).resolves.toEqual({
      canManageMerchants: false,
      tags: [],
    });
    expect(mocks.createServerRequestDependencies).not.toHaveBeenCalled();
    expect(mocks.listTags).not.toHaveBeenCalled();
  });
});
