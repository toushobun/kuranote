import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  archiveMerchantTag: vi.fn(),
  createMerchantTag: vi.fn(),
  loadMerchantTagsView: vi.fn(),
  MerchantTagsTemplate: vi.fn(() => null),
  redirect: vi.fn(),
  reorderMerchantTags: vi.fn(),
  updateMerchantTag: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("internal/merchant/adapter/next/actions", () => ({
  archiveMerchantTag: mocks.archiveMerchantTag,
  createMerchantTag: mocks.createMerchantTag,
  reorderMerchantTags: mocks.reorderMerchantTags,
  updateMerchantTag: mocks.updateMerchantTag,
}));
vi.mock("internal/merchant/adapter/next/loadMerchantTagsView", () => ({
  loadMerchantTagsView: mocks.loadMerchantTagsView,
}));
vi.mock("templates/merchants/MerchantTags", () => ({
  MerchantTagsTemplate: mocks.MerchantTagsTemplate,
}));

import MerchantTagsPage from "./page";

const tags = [
  { icon: "🛒", id: "tag-1", merchant_count: 2, name: "超市", sort_order: 0 },
];

describe("MerchantTagsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadMerchantTagsView.mockResolvedValue({
      canManageMerchants: true,
      tags,
    });
  });

  it("加载标签并传递管理 Action", async () => {
    const result = await MerchantTagsPage();
    const element = result as ReactElement<Record<string, unknown>>;

    expect(mocks.loadMerchantTagsView).toHaveBeenCalledWith();
    expect(element.props).toMatchObject({
      archiveAction: mocks.archiveMerchantTag,
      createAction: mocks.createMerchantTag,
      reorderAction: mocks.reorderMerchantTags,
      tags,
      updateAction: mocks.updateMerchantTag,
    });
  });

  it("无管理权限时返回商家列表", async () => {
    mocks.loadMerchantTagsView.mockResolvedValue({
      canManageMerchants: false,
      tags,
    });

    await MerchantTagsPage();

    expect(mocks.redirect).toHaveBeenCalledWith("/merchants");
  });
});
