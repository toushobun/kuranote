// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createLedgerAccessMock } from "test/mocks/ledgerAccess";
import { createMerchantExportQueryService } from "./merchantExportQueryService";

function setup() {
  const merchantRepository = {
    findSummariesByIds: vi
      .fn()
      .mockResolvedValue([{ id: "merchant", name: "首选别名" }]),
    listExportTagNames: vi.fn().mockResolvedValue([
      { merchantId: "merchant", name: "餐饮" },
      { merchantId: "merchant", name: "附近" },
    ]),
  };
  const ledgerAccessService = createLedgerAccessMock();
  return {
    merchantRepository,
    ledgerAccessService,
    service: createMerchantExportQueryService({
      merchantRepository,
      ledgerAccessService,
    }),
  };
}
const input = {
  ledgerId: "ledger",
  userId: "viewer",
  merchantIds: ["merchant"],
};
describe("merchantExportQueryService", () => {
  it("保留商家展示名及全部标签", async () => {
    const { service } = setup();
    await expect(service.findExportSummaries(input)).resolves.toEqual([
      { id: "merchant", name: "首选别名", tagNames: ["餐饮", "附近"] },
    ]);
  });
  it("没有账本成员身份时不读取商家", async () => {
    const { service, merchantRepository, ledgerAccessService } = setup();
    ledgerAccessService.getActiveMemberRole.mockResolvedValue(null);
    await expect(service.findExportSummaries(input)).rejects.toMatchObject({
      code: "ledger_invalid",
    });
    expect(merchantRepository.findSummariesByIds).not.toHaveBeenCalled();
  });
});
