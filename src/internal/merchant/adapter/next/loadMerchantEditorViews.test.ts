// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertCanManage: vi.fn(),
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  getCurrentLedgerOrRedirect: vi.fn(),
  getMerchant: vi.fn(),
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

import {
  loadMerchantCreateView,
  loadMerchantEditView,
} from "./loadMerchantEditorViews";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const merchantId = "00000000-0000-4000-8000-000000001001";
const tags = [
  { icon: "🛒", id: "tag-1", merchant_count: 2, name: "超市", sort_order: 0 },
];

describe("loadMerchantEditorViews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentLedgerOrRedirect.mockResolvedValue({
      id: ledgerId,
      name: "家庭账本",
    });
    mocks.createServerRequestDependencies.mockResolvedValue({});
    mocks.assertCanManage.mockResolvedValue(undefined);
    mocks.getMerchant.mockResolvedValue({ id: merchantId });
    mocks.listTags.mockResolvedValue(tags);
    mocks.createRequestContainer.mockReturnValue({
      merchant: {
        service: {
          assertCanManage: mocks.assertCanManage,
          getMerchant: mocks.getMerchant,
          listTags: mocks.listTags,
        },
      },
    });
  });

  it("新建页通过管理权限校验后才读取标签", async () => {
    await expect(loadMerchantCreateView()).resolves.toMatchObject({ tags });
    expect(mocks.assertCanManage.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.listTags.mock.invocationCallOrder[0],
    );
  });

  it("新建页权限校验失败时不读取标签", async () => {
    mocks.assertCanManage.mockRejectedValue(new Error("permission denied"));

    await expect(loadMerchantCreateView()).rejects.toThrow("permission denied");
    expect(mocks.listTags).not.toHaveBeenCalled();
  });

  it("编辑页读取并校验商家后才读取标签", async () => {
    await expect(loadMerchantEditView(merchantId)).resolves.toMatchObject({
      merchant: { id: merchantId },
      tags,
    });
    expect(mocks.getMerchant.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.listTags.mock.invocationCallOrder[0],
    );
  });

  it("编辑页商家读取或权限校验失败时不读取标签", async () => {
    mocks.getMerchant.mockRejectedValue(new Error("permission denied"));

    await expect(loadMerchantEditView(merchantId)).rejects.toThrow(
      "permission denied",
    );
    expect(mocks.listTags).not.toHaveBeenCalled();
  });
});
