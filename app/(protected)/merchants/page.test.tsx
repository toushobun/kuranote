import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  archiveMerchantTag: vi.fn(),
  createMerchantTag: vi.fn(),
  loadMerchantsView: vi.fn(),
  MerchantsTemplate: vi.fn(() => null),
  reorderMerchantTags: vi.fn(),
  updateMerchantTag: vi.fn(),
}));

vi.mock("internal/merchant/adapter/next/actions", () => ({
  archiveMerchantTag: mocks.archiveMerchantTag,
  createMerchantTag: mocks.createMerchantTag,
  reorderMerchantTags: mocks.reorderMerchantTags,
  updateMerchantTag: mocks.updateMerchantTag,
}));
vi.mock("internal/merchant/adapter/next/loadMerchantsView", () => ({
  loadMerchantsView: mocks.loadMerchantsView,
}));
vi.mock("templates/merchants/Merchants", () => ({
  MerchantsTemplate: mocks.MerchantsTemplate,
}));

import MerchantsPage from "./page";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const tagId = "00000000-0000-4000-8000-000000002001";

describe("MerchantsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadMerchantsView.mockResolvedValue({
      canManageMerchants: true,
      ledgerId,
      merchants: [],
      selectedTag: null,
      tags: [],
    });
  });

  it("把关键词和标签查询参数交给 Merchant loader", async () => {
    await MerchantsPage({
      searchParams: Promise.resolve({ q: " LIFE ", tagId }),
    });
    expect(mocks.loadMerchantsView).toHaveBeenCalledWith({
      keyword: " LIFE ",
      tagId,
    });
  });

  it("传递商家列表视图数据，不读取错误查询参数", async () => {
    const result = await MerchantsPage({
      searchParams: Promise.resolve({ q: "LIFE" }),
    });
    const element = result as ReactElement<Record<string, unknown>>;
    expect(element.props).toMatchObject({
      archiveAction: mocks.archiveMerchantTag,
      canManageMerchants: true,
      createAction: mocks.createMerchantTag,
      keyword: "LIFE",
      ledgerId,
      merchants: [],
      selectedTag: null,
      reorderAction: mocks.reorderMerchantTags,
      tags: [],
      updateAction: mocks.updateMerchantTag,
    });
    expect(element.props).not.toHaveProperty("errorMessage");
  });
});
