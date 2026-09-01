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

  it("新建页并行校验管理权限与读取标签", async () => {
    let resolvePermission: (() => void) | undefined;
    let resolveTags: ((value: typeof tags) => void) | undefined;
    mocks.assertCanManage.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePermission = resolve;
        }),
    );
    mocks.listTags.mockImplementation(
      () =>
        new Promise<typeof tags>((resolve) => {
          resolveTags = resolve;
        }),
    );

    const operation = loadMerchantCreateView();
    await vi.waitFor(() => {
      expect(mocks.assertCanManage).toHaveBeenCalledOnce();
      expect(mocks.listTags).toHaveBeenCalledOnce();
    });
    resolvePermission?.();
    resolveTags?.(tags);

    await expect(operation).resolves.toMatchObject({ tags });
  });

  it("编辑页并行读取商家与标签", async () => {
    const merchant = { id: merchantId };
    let resolveMerchant: ((value: typeof merchant) => void) | undefined;
    let resolveTags: ((value: typeof tags) => void) | undefined;
    mocks.getMerchant.mockImplementation(
      () =>
        new Promise<typeof merchant>((resolve) => {
          resolveMerchant = resolve;
        }),
    );
    mocks.listTags.mockImplementation(
      () =>
        new Promise<typeof tags>((resolve) => {
          resolveTags = resolve;
        }),
    );

    const operation = loadMerchantEditView(merchantId);
    await vi.waitFor(() => {
      expect(mocks.getMerchant).toHaveBeenCalledOnce();
      expect(mocks.listTags).toHaveBeenCalledOnce();
    });
    resolveMerchant?.(merchant);
    resolveTags?.(tags);

    await expect(operation).resolves.toMatchObject({ merchant, tags });
  });
});
