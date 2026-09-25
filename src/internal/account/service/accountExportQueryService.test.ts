// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createLedgerAccessMock } from "test/mocks/ledgerAccess";
import { createAccountExportQueryService } from "./accountExportQueryService";

function setup() {
  const accountRepository = {
    findSummariesByIds: vi.fn().mockResolvedValue([
      { id: "account", name: "已归档账户", currency: "JPY", type: "bank" },
      { id: "none", name: "公共账户", currency: "JPY", type: "other" },
      { id: "grandma", name: "奶奶的钱包", currency: "JPY", type: "cash" },
    ]),
    listHolders: vi.fn().mockResolvedValue([
      { account_id: "account", placeholder_id: null, user_id: "holder" },
      { account_id: "grandma", placeholder_id: "placeholder", user_id: null },
    ]),
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
  const ledgerPlaceholderMemberQueryService = {
    listUnclaimed: vi
      .fn()
      .mockResolvedValue([{ displayName: "奶奶", id: "placeholder" }]),
  };
  return {
    accountRepository,
    ledgerAccessService,
    service: createAccountExportQueryService({
      accountRepository,
      ledgerAccessService,
      ledgerPlaceholderMemberQueryService,
    }),
  };
}
const input = {
  ledgerId: "ledger",
  userId: "viewer",
  accountIds: ["account", "none", "grandma"],
};

describe("accountExportQueryService", () => {
  it("允许只读成员导出，并保留历史账户、账户类型、持有人账本显示名和设置颜色", async () => {
    const { service, accountRepository, ledgerAccessService } = setup();
    const result = await service.findExportSummaries(input);
    expect(result.map((account) => account.type)).toEqual([
      "bank",
      "other",
      "cash",
    ]);
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
  it("占位持有的账户导出占位名字且不着色，不按占位 ID 查询用户", async () => {
    const { service, accountRepository } = setup();
    const result = await service.findExportSummaries(input);
    expect(result[2]).toMatchObject({
      name: "奶奶的钱包",
      holder: { name: "奶奶", displayColor: null },
    });
    expect(accountRepository.listUsers).toHaveBeenCalledWith(["holder"]);
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
  it("账户超过一批时分批读取账户与持有人，账本级设置只读一次", async () => {
    const { service, accountRepository } = setup();
    accountRepository.findSummariesByIds.mockResolvedValue([]);
    accountRepository.listHolders.mockResolvedValue([]);
    const accountIds = Array.from({ length: 204 }, (_, index) => `a-${index}`);
    await service.findExportSummaries({ ...input, accountIds });
    expect(
      accountRepository.findSummariesByIds.mock.calls.map(
        ([, ids]) => ids.length,
      ),
    ).toEqual([100, 100, 4]);
    expect(accountRepository.listDisplaySettings).toHaveBeenCalledTimes(1);
    expect(accountRepository.listActiveMembers).toHaveBeenCalledTimes(1);
  });
  it("没有账户标识时不发起任何仓储查询", async () => {
    const { service, accountRepository } = setup();
    await expect(
      service.findExportSummaries({ ...input, accountIds: [] }),
    ).resolves.toEqual([]);
    expect(accountRepository.findSummariesByIds).not.toHaveBeenCalled();
    expect(accountRepository.listDisplaySettings).not.toHaveBeenCalled();
  });
});
