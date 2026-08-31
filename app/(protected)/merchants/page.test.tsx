import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadMerchantsView: vi.fn(),
  MerchantsTemplate: vi.fn(() => null),
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
      canManageMerchants: true,
      keyword: "LIFE",
      ledgerId,
      merchants: [],
      selectedTag: null,
      tags: [],
    });
    expect(element.props).not.toHaveProperty("errorMessage");
  });
});
