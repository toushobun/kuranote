// @vitest-environment node
import { offsetEntry } from "test/mocks/transactionOffsetEntry";
import { describe, expect, it, vi } from "vitest";
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";
import { createMerchantEntryQueryService } from "./merchantEntryQueryService";
const ledgerId = "00000000-0000-4000-8000-000000000001";
const merchantId = "00000000-0000-4000-8000-000000000002";
function setup(userId: string | null = "user") {
  const ledgerAccessService = {
    getActiveMemberRole: vi.fn().mockResolvedValue("owner"),
  };
  const merchantQueryService = {
    findSummariesByIds: vi.fn().mockResolvedValue([{ id: merchantId }]),
  };
  const repository = {
    loadOffsetEntry: vi.fn().mockResolvedValue(null),
    loadFrequentMerchantCounts: vi
      .fn()
      .mockResolvedValue([{ merchantId, recordCount: 50 }]),
    loadMerchantHistory: vi.fn().mockResolvedValue([]),
  };
  return {
    repository,
    ledgerAccessService,
    merchantQueryService,
    service: createMerchantEntryQueryService({
      currentUserId: userId,
      ledgerAccessService,
      merchantQueryService,
      repository,
    }),
  };
}
describe("merchantEntryQueryService", () => {
  it("验证账本 active 身份并使用常量读取商家排行及最近样本，无历史返回空结果", async () => {
    const { service, repository, ledgerAccessService, merchantQueryService } =
      setup();
    expect(await service.getFrequentMerchants({ ledgerId })).toEqual([
      { merchantId, recordCount: 50 },
    ]);
    expect(
      await service.getMerchantSuggestions({ ledgerId, merchantId }),
    ).toEqual({
      recommendedAccountIds: [],
      automaticCategoryIds: [],
      quickAmounts: [],
    });
    expect(repository.loadFrequentMerchantCounts).toHaveBeenCalledWith(
      ledgerId,
      8,
    );
    expect(repository.loadMerchantHistory).toHaveBeenCalledWith(
      ledgerId,
      merchantId,
      20,
    );
    expect(ledgerAccessService.getActiveMemberRole).toHaveBeenCalledWith({
      ledgerId,
      userId: "user",
    });
    expect(merchantQueryService.findSummariesByIds).toHaveBeenCalledWith({
      ledgerId,
      merchantIds: [merchantId],
    });
  });
  it("正常样本返回统计结果", async () => {
    const { service, repository } = setup();
    repository.loadMerchantHistory.mockResolvedValue([
      {
        id: "r",
        payments: [
          { accountId: "account", currency: "JPY", isArchived: false },
        ],
        items: [{ categoryId: "food", amount: "123" }],
      },
    ]);
    expect(
      (await service.getMerchantSuggestions({ ledgerId, merchantId }))
        .recommendedAccountIds,
    ).toEqual(["account"]);
  });
  it("未登录拒绝两个查询，且不读取数据", async () => {
    const { service, repository } = setup(null);
    await expect(
      service.getFrequentMerchants({ ledgerId }),
    ).rejects.toBeInstanceOf(AuthenticationError);
    await expect(
      service.getMerchantSuggestions({ ledgerId, merchantId }),
    ).rejects.toBeInstanceOf(AuthenticationError);
    expect(repository.loadMerchantHistory).not.toHaveBeenCalled();
    expect(repository.loadFrequentMerchantCounts).not.toHaveBeenCalled();
  });
  it("无 active 成员身份拒绝两个查询", async () => {
    const { service, ledgerAccessService, repository, merchantQueryService } =
      setup();
    ledgerAccessService.getActiveMemberRole.mockResolvedValue(null);
    await expect(
      service.getFrequentMerchants({ ledgerId }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      service.getMerchantSuggestions({ ledgerId, merchantId }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(repository.loadFrequentMerchantCounts).not.toHaveBeenCalled();
    expect(merchantQueryService.findSummariesByIds).not.toHaveBeenCalled();
  });
  it("服务直接调用也校验所有输入 UUID", async () => {
    const { service, ledgerAccessService } = setup();
    await expect(
      service.getFrequentMerchants({ ledgerId: "bad" }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.getMerchantSuggestions({ ledgerId, merchantId: "bad" }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.getMerchantSuggestions({ ledgerId: "bad", merchantId }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(ledgerAccessService.getActiveMemberRole).not.toHaveBeenCalled();
  });
  it("商家不属于指定账本时拒绝读取历史", async () => {
    const { service, repository, merchantQueryService } = setup();
    merchantQueryService.findSummariesByIds.mockResolvedValue([]);
    await expect(
      service.getMerchantSuggestions({ ledgerId, merchantId }),
    ).rejects.toMatchObject({ code: "merchant_invalid" });
    expect(repository.loadMerchantHistory).not.toHaveBeenCalled();
  });
});

it("来源预填要求写权限，且无效标识不读取数据库", async () => {
  const { service, repository, ledgerAccessService } = setup();
  expect(
    await service.getOffsetEntry({ ledgerId, recordId: "bad", kind: "refund" }),
  ).toBeNull();
  expect(repository.loadOffsetEntry).not.toHaveBeenCalled();
  repository.loadOffsetEntry.mockResolvedValue({
    entry: offsetEntry,
    merchantHistory: [],
  });
  ledgerAccessService.getActiveMemberRole.mockResolvedValue("viewer");
  expect(
    await service.getOffsetEntry({
      ledgerId,
      recordId: merchantId,
      kind: "refund",
    }),
  ).toBeNull();
  ledgerAccessService.getActiveMemberRole.mockResolvedValue("member");
  await service.getOffsetEntry({
    ledgerId,
    recordId: merchantId,
    kind: "refund",
  });
  expect(repository.loadOffsetEntry).toHaveBeenCalledWith(
    ledgerId,
    merchantId,
    "refund",
  );
});

it.each([
  [
    "优先采用推荐列表里的第一个同币种账户",
    [{ accountId: "recommended", currency: "JPY", isArchived: false }],
    "recommended",
  ],
  [
    "跳过推荐列表里币种不一致的账户",
    [
      { accountId: "other-currency", currency: "THB", isArchived: false },
      { accountId: "same-currency", currency: "JPY", isArchived: false },
    ],
    "same-currency",
  ],
  [
    "没有同币种推荐账户时回退原付款账户",
    [{ accountId: "other-currency", currency: "THB", isArchived: false }],
    "paypay",
  ],
  ["没有商家历史时回退原付款账户", [], "paypay"],
  [
    "已归档的推荐账户不采用",
    [{ accountId: "archived", currency: "JPY", isArchived: true }],
    "paypay",
  ],
  [
    "仅在商家的前三个推荐账户中选择",
    [
      { accountId: "a", currency: "THB", isArchived: false },
      { accountId: "b", currency: "USD", isArchived: false },
      { accountId: "c", currency: "CNY", isArchived: false },
      { accountId: "d", currency: "JPY", isArchived: false },
    ],
    "paypay",
  ],
])("%s", async (_label, payments, expected) => {
  const { service, repository } = setup();
  repository.loadOffsetEntry.mockResolvedValue({
    entry: offsetEntry,
    merchantHistory: [{ id: "history", items: [], payments }],
  });
  expect(
    (
      await service.getOffsetEntry({
        ledgerId,
        recordId: merchantId,
        kind: "refund",
      })
    )?.accountId,
  ).toBe(expected);
});

it.each([
  {
    name: "退款采用原商家的历史退款商家",
    kind: "refund" as const,
    merchantId: "history-refund",
  },
  {
    name: "退款无历史时保留原商家回退",
    kind: "refund" as const,
    merchantId: "seven",
  },
  {
    name: "报销采用原商家的历史报销商家",
    kind: "reimbursement" as const,
    merchantId: "history-reimbursement",
  },
  {
    name: "报销原商家无历史时保留账本推荐",
    kind: "reimbursement" as const,
    merchantId: "ledger-reimbursement",
  },
  {
    name: "报销完全无历史时保持商家为空，不误带出候选商家",
    kind: "reimbursement" as const,
    merchantId: null,
  },
])("$name", async ({ kind, merchantId: recommendedMerchantId }) => {
  const { service, repository } = setup();
  repository.loadOffsetEntry.mockResolvedValue({
    entry: { ...offsetEntry, kind, merchantId: recommendedMerchantId },
    merchantHistory: [],
  });
  const result = await service.getOffsetEntry({
    ledgerId,
    recordId: merchantId,
    kind,
  });
  expect(result?.merchantId).toBe(recommendedMerchantId);
  expect(result?.accountId).toBe(offsetEntry.accountId);
});
