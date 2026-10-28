// @vitest-environment node
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
