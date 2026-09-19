// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createLedgerAccessMock } from "test/mocks/ledgerAccess";
import { createAccountExportQueryService } from "./accountExportQueryService";

function setup() {
  const accountRepository = {
    findSummariesByIds: vi.fn().mockResolvedValue([
      { id: "account", name: "已归档账户", currency: "JPY" },
      { id: "none", name: "公共账户", currency: "JPY" },
    ]),
    listHolders: vi
      .fn()
      .mockResolvedValue([{ account_id: "account", user_id: "holder" }]),
    listDisplaySettings: vi.fn().mockResolvedValue([
      {
        user_id: "holder",
        display_color: "rose",
        display_name: "账本显示名",
      },
    ]),
    listActiveMembers: vi.fn().mockResolvedValue([]),
    listUsers: vi
      .fn()
      .mockResolvedValue([{ id: "holder", display_name: "原名" }]),
  };
  const ledgerAccessService = createLedgerAccessMock();
  return {
    accountRepository,
    ledgerAccessService,
    service: createAccountExportQueryService({
      accountRepository,
      ledgerAccessService,
    }),
  };
}
const input = {
  ledgerId: "ledger",
  userId: "viewer",
  accountIds: ["account", "none"],
};

describe("accountExportQueryService", () => {
  it("允许只读成员导出，并保留历史账户、持有人账本显示名和设置颜色", async () => {
    const { service, accountRepository, ledgerAccessService } = setup();
    const result = await service.findExportSummaries(input);
    expect(result[0]).toMatchObject({
      name: "已归档账户",
      holder: { name: "账本显示名", displayColor: "rose" },
    });
    expect(result[1].holder).toBeNull();
    expect(accountRepository.findSummariesByIds).toHaveBeenCalledWith(
      "ledger",
      input.accountIds,
    );
    expect(ledgerAccessService.getActiveMemberRole).toHaveBeenCalledWith({
      ledgerId: "ledger",
      userId: "viewer",
    });
  });
  it("没有显示设置时复用 App 的持有人名称及颜色兜底", async () => {
    const { service, accountRepository } = setup();
    accountRepository.listDisplaySettings.mockResolvedValue([]);
    accountRepository.listActiveMembers.mockResolvedValue([
      { user_id: "holder", created_at: "2026-01-01", joined_at: null },
    ]);
    expect((await service.findExportSummaries(input))[0].holder).toEqual({
      name: "原名",
      displayColor: "jade",
    });
  });
  it("非成员不会读取账户或持有人资料", async () => {
    const { service, accountRepository, ledgerAccessService } = setup();
    ledgerAccessService.getActiveMemberRole.mockResolvedValue(null);
    await expect(service.findExportSummaries(input)).rejects.toMatchObject({
      code: "ledger_invalid",
    });
    expect(accountRepository.findSummariesByIds).not.toHaveBeenCalled();
  });
});
