// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  ledger: vi.fn(),
  account: vi.fn(),
  merchant: vi.fn(),
}));
vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  getCurrentLedgerOrRedirect: mocks.ledger,
}));
vi.mock("internal/account/adapter/next/loadAccountsView", () => ({
  loadAccountCreateView: mocks.account,
}));
vi.mock("internal/merchant/adapter/next/loadMerchantEditorViews", () => ({
  loadMerchantCreateView: mocks.merchant,
}));
vi.mock("internal/account/adapter/next/actions", () => ({
  createAccount: vi.fn(),
}));
vi.mock("internal/merchant/adapter/next/actions", () => ({
  createMerchant: vi.fn(),
  fetchMerchantIcon: vi.fn(),
}));
import { loadReceiptCreationView } from "./loadReceiptCreationView";

describe("loadReceiptCreationView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.account.mockResolvedValue({ baseCurrency: "JPY" });
    mocks.merchant.mockResolvedValue({ tags: [] });
  });
  it.each(["member", "viewer"])(
    "%s 无管理权限时不加载新增数据",
    async (role) => {
      mocks.ledger.mockResolvedValue({ currentUserRole: role });
      expect(await loadReceiptCreationView()).toBeNull();
      expect(mocks.account).not.toHaveBeenCalled();
      expect(mocks.merchant).not.toHaveBeenCalled();
    },
  );
  it.each(["owner", "admin"])(
    "%s 复用两个独立新增页读取及 Action",
    async (role) => {
      mocks.ledger.mockResolvedValue({ currentUserRole: role });
      expect(await loadReceiptCreationView()).toMatchObject({
        account: {
          baseCurrency: "JPY",
          createAccountAction: expect.any(Function),
        },
        merchant: {
          tags: [],
          createMerchantAction: expect.any(Function),
          fetchIconAction: expect.any(Function),
        },
      });
      expect(mocks.account).toHaveBeenCalledOnce();
      expect(mocks.merchant).toHaveBeenCalledOnce();
    },
  );
});
