import { makeBalanceAdjustmentTable } from "test/mocks/dataImport";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AccountImportService } from "internal/account";
import type { CategoryImportService } from "internal/category";
import type { ParsedTable } from "internal/dataImport/entity/parsedTable";
import { dataImportExecutionErrorMessages } from "internal/dataImport/errors";
import {
  incomeExpenseColumns,
  transferColumns,
  type ImportHolderMapping,
} from "internal/dataImport/schema";
import { createDataImportExecutionService } from "internal/dataImport/service/dataImportExecutionService";
import { analyzeImportWorkbook } from "internal/dataImport/util/validateImportWorkbook";
import {
  getLedgerPlaceholderMemberErrorMessage,
  type LedgerPlaceholderImportService,
} from "internal/ledger";
import type { MerchantImportService } from "internal/merchant";
import {
  AuthorizationError,
  ConflictError,
  RepositoryError,
} from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";
import type { TransactionImportService } from "internal/transaction";

function unitsOf(tables: ParsedTable[]) {
  return analyzeImportWorkbook(tables).units;
}

function tableRow(
  headers: string[],
  rowNumber: number,
  values: Record<string, string>,
) {
  return {
    cells: headers.map((header) => values[header] ?? ""),
    rowNumber,
  };
}

function incomeTable(rows: Array<Record<string, string>>): ParsedTable {
  const headers = incomeExpenseColumns.map((column) => column.name);
  return {
    headerRow: headers,
    rows: rows.map((row, index) => tableRow(headers, index + 2, row)),
    sourceName: "收支",
  };
}

function transferTable(rows: Array<Record<string, string>>): ParsedTable {
  const headers = transferColumns.map((column) => column.name);
  return {
    headerRow: headers,
    rows: rows.map((row, index) => tableRow(headers, index + 2, row)),
    sourceName: "转账",
  };
}

function incomeRow(overrides: Record<string, string> = {}) {
  return {
    日期: "2026-09-17 10:00:00",
    商家分类: "超市",
    商家: "业务超市",
    交易类型: "支出",
    一级分类: "餐饮",
    二级分类: "食材",
    账户: "钱包",
    账户持有人: "淞文",
    账户币种: "JPY",
    金额: "1200",
    备注: "测试",
    ...overrides,
  };
}

const placeholderId = "00000000-0000-4000-8000-000000000051";

function member(userId: string) {
  return { kind: "member", userId } as const;
}

const none = { kind: "none" } as const;

function createDependencies() {
  const accountImportService: AccountImportService = {
    createAccount: vi.fn(async ({ name }) => ({
      accountId: `account-${name}`,
    })),
    loadContext: vi.fn(async () => ({
      accounts: [],
      holders: [{ displayName: "淞文", userId: "user-1" }],
    })),
  };
  const categoryImportService: CategoryImportService = {
    createCategory: vi.fn(async ({ name, parentId }) => ({
      categoryId: `${parentId ?? "root"}-${name}`,
    })),
    listCategories: vi.fn(async () => []),
  };
  const merchantImportService: MerchantImportService = {
    addTag: vi.fn(async () => undefined),
    createMerchant: vi.fn(async ({ name }) => ({
      merchantId: `merchant-${name}`,
    })),
    createTag: vi.fn(async ({ name }) => ({ tagId: `tag-${name}` })),
    loadContext: vi.fn(async () => ({ merchants: [], tags: [] })),
  };
  const transactionImportService: TransactionImportService = {
    createBalanceAdjustment: vi.fn(async () => undefined),
    hasPossibleBalanceAdjustmentDuplicate: vi.fn(async () => false),
    createNormal: vi.fn(async () => undefined),
    createTransfer: vi.fn(async () => undefined),
    hasPossibleNormalDuplicate: vi.fn(async () => false),
    hasPossibleTransferDuplicate: vi.fn(async () => false),
  };
  const ledgerPlaceholderImportService: LedgerPlaceholderImportService = {
    ensureForImport: vi.fn(
      async ({ displayNames }: { displayNames: string[] }) =>
        new Map(displayNames.map((name) => [name, `new-${name}`])),
    ),
    listUnclaimed: vi.fn(async () => [
      { displayName: "奶奶", id: placeholderId },
    ]),
  };
  const logger: Logger = {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };

  return {
    accountImportService,
    categoryImportService,
    ledgerPlaceholderImportService,
    logger,
    merchantImportService,
    transactionImportService,
  };
}

/** 整批被拒绝时不得发生任何写入（包括待邀请成员的批量确保）。 */
function expectNoWrites(dependencies: ReturnType<typeof createDependencies>) {
  for (const write of [
    dependencies.ledgerPlaceholderImportService.ensureForImport,
    dependencies.accountImportService.createAccount,
    dependencies.categoryImportService.createCategory,
    dependencies.merchantImportService.createTag,
    dependencies.merchantImportService.createMerchant,
    dependencies.transactionImportService.createNormal,
    dependencies.transactionImportService.createTransfer,
    dependencies.transactionImportService.createBalanceAdjustment,
  ]) {
    expect(write).not.toHaveBeenCalled();
  }
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DataImportExecutionService", () => {
  it.each([null, "user-1"])(
    "同名同持有人 %s 的账户按币种匹配收支与转账",
    async (holderUserId) => {
      const holderName = holderUserId ? "淞文" : "";
      const units = unitsOf([
        incomeTable([incomeRow({ 账户持有人: holderName })]),
        transferTable([
          {
            交易类型: "转账",
            日期: "2026-09-17 10:00:00",
            转出账户: "钱包",
            转出账户币种: "JPY",
            转出账户持有人: holderName,
            转入账户: "银行卡",
            转入账户币种: "JPY",
            转入账户持有人: holderName,
            金额: "100",
          },
        ]),
      ]);
      const dependencies = createDependencies();
      vi.mocked(
        dependencies.accountImportService.loadContext,
      ).mockResolvedValue({
        accounts: ["钱包", "银行卡"].flatMap((name) =>
          ["USD", "JPY"].map((currency) => ({
            currency,
            isArchived: false,
            holder: holderUserId
              ? { kind: "member" as const, userId: holderUserId }
              : null,
            id: `${name}-${currency}`,
            name,
          })),
        ),
        holders: [{ displayName: "淞文", userId: "user-1" }],
      });
      const result = await createDataImportExecutionService(
        dependencies,
      ).executeBatch({
        ledgerId: "ledger-1",
        units,
        timeZoneOffsetMinutes: -540,
        userId: "user-1",
      });
      expect(result.successCount).toBe(2);
      expect(
        dependencies.accountImportService.createAccount,
      ).not.toHaveBeenCalled();
      expect(
        dependencies.transactionImportService.createNormal,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ accountId: "钱包-JPY" }),
      );
      expect(
        dependencies.transactionImportService.createTransfer,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: "钱包-JPY",
          transferTargetAccountId: "银行卡-JPY",
        }),
      );
    },
  );

  it.each([false, true])(
    "币种匹配不存在时创建、同币种仍有歧义时拒绝：%s",
    async (ambiguous) => {
      const units = unitsOf([
        incomeTable([incomeRow(), incomeRow({ 商家: "另一个商家" })]),
      ]);
      const dependencies = createDependencies();
      vi.mocked(
        dependencies.accountImportService.loadContext,
      ).mockResolvedValue({
        accounts: ["account-1", "account-2"].map((id) => ({
          currency: ambiguous ? "JPY" : "USD",
          isArchived: false,
          holder: { kind: "member", userId: "user-1" },
          id,
          name: "钱包",
        })),
        holders: [{ displayName: "淞文", userId: "user-1" }],
      });
      const result = await createDataImportExecutionService(
        dependencies,
      ).executeBatch({
        ledgerId: "ledger-1",
        units,
        timeZoneOffsetMinutes: -540,
        userId: "user-1",
      });
      expect(result.failureCount).toBe(ambiguous ? 2 : 0);
      expect(
        dependencies.transactionImportService.createNormal,
      ).toHaveBeenCalledTimes(ambiguous ? 0 : 2);
      expect(
        dependencies.accountImportService.createAccount,
      ).toHaveBeenCalledTimes(ambiguous ? 0 : 1);
      if (!ambiguous) {
        expect(
          dependencies.accountImportService.createAccount,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            currency: "JPY",
            holder: { kind: "member", userId: "user-1" },
            name: "钱包",
          }),
        );
      }
    },
  );

  it("缺失的分类、商家标签、商家和账户会自动创建后写入交易", async () => {
    const units = unitsOf([incomeTable([incomeRow()])]);
    const dependencies = createDependencies();
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      ledgerId: "ledger-1",
      units,
      timeZoneOffsetMinutes: 0,
      userId: "user-1",
    });

    expect(
      dependencies.accountImportService.createAccount,
    ).toHaveBeenCalledWith({
      currency: "JPY",
      holder: { kind: "member", userId: "user-1" },
      ledgerId: "ledger-1",
      name: "钱包",
      userId: "user-1",
    });
    expect(
      dependencies.categoryImportService.createCategory,
    ).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: "餐饮",
        parentId: null,
        type: "expense",
      }),
    );
    expect(
      dependencies.categoryImportService.createCategory,
    ).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ name: "食材", type: "expense" }),
    );
    expect(dependencies.merchantImportService.createTag).toHaveBeenCalledWith({
      ledgerId: "ledger-1",
      name: "超市",
    });
    expect(
      dependencies.merchantImportService.createMerchant,
    ).toHaveBeenCalledWith({
      ledgerId: "ledger-1",
      name: "业务超市",
      tagIds: ["tag-超市"],
    });
    expect(
      dependencies.transactionImportService.createNormal,
    ).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      duplicateCount: 0,
      failureCount: 0,
      processedCount: 1,
      successCount: 1,
    });
  });

  it("疑似重复仍继续写入并单独统计警告", async () => {
    const units = unitsOf([incomeTable([incomeRow()])]);
    const dependencies = createDependencies();
    vi.mocked(
      dependencies.transactionImportService.hasPossibleNormalDuplicate,
    ).mockResolvedValue(true);
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      ledgerId: "ledger-1",
      units,
      timeZoneOffsetMinutes: 0,
      userId: "user-1",
    });

    expect(
      dependencies.transactionImportService.createNormal,
    ).toHaveBeenCalledOnce();
    expect(result.successCount).toBe(1);
    expect(result.duplicateCount).toBe(1);
    expect(result.details).toEqual([
      expect.objectContaining({ status: "duplicate", rowNumbers: [2] }),
    ]);
    expect(result.rowResults[0]).toMatchObject({
      rowNumber: 2,
      status: "duplicate",
    });
  });

  it("账户持有人匹配不到账本成员时按无持有人继续导入并计入警告", async () => {
    const units = unitsOf([incomeTable([incomeRow({ 账户持有人: "小明" })])]);
    const dependencies = createDependencies();
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      ledgerId: "ledger-1",
      units,
      timeZoneOffsetMinutes: 0,
      userId: "user-1",
    });

    expect(
      dependencies.accountImportService.createAccount,
    ).toHaveBeenCalledWith(expect.objectContaining({ holder: null }));
    expect(
      dependencies.transactionImportService.createNormal,
    ).toHaveBeenCalledOnce();
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(0);
    expect(result.holderMissingCount).toBe(1);
    expect(result.details).toEqual([
      expect.objectContaining({
        status: "holderMissing",
        reason: expect.stringContaining("小明"),
      }),
    ]);
    expect(result.rowResults[0]).toMatchObject({
      rowNumber: 2,
      status: "holderMissing",
    });
  });

  it("转账两侧持有人都匹配不到账本成员时合并展示提示且仍继续导入", async () => {
    const units = unitsOf([
      transferTable([
        {
          交易类型: "转账",
          日期: "2026-09-17 12:00:00",
          转出账户: "钱包",
          转出账户币种: "JPY",
          转出账户持有人: "小明",
          转入账户: "银行卡",
          转入账户币种: "JPY",
          转入账户持有人: "小红",
          金额: "5000",
        },
      ]),
    ]);
    const dependencies = createDependencies();
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      ledgerId: "ledger-1",
      units,
      timeZoneOffsetMinutes: 0,
      userId: "user-1",
    });

    expect(
      dependencies.transactionImportService.createTransfer,
    ).toHaveBeenCalledOnce();
    expect(result.successCount).toBe(1);
    expect(result.holderMissingCount).toBe(1);
    expect(result.details[0]?.reason).toContain("小明");
    expect(result.details[0]?.reason).toContain("小红");
  });

  it("转账两侧持有人是同一个未匹配姓名时提示只展示一次", async () => {
    const units = unitsOf([
      transferTable([
        {
          交易类型: "转账",
          日期: "2026-09-17 12:00:00",
          转出账户: "钱包",
          转出账户币种: "JPY",
          转出账户持有人: "小明",
          转入账户: "银行卡",
          转入账户币种: "JPY",
          转入账户持有人: "小明",
          金额: "5000",
        },
      ]),
    ]);
    const dependencies = createDependencies();
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      ledgerId: "ledger-1",
      units,
      timeZoneOffsetMinutes: 0,
      userId: "user-1",
    });

    expect(result.holderMissingCount).toBe(1);
    const occurrences = result.details[0]?.reason.split("小明").length ?? 0;
    expect(occurrences - 1).toBe(1);
  });

  it("账本内存在多个同显示名成员时该行判定为失败", async () => {
    const units = unitsOf([incomeTable([incomeRow()])]);
    const dependencies = createDependencies();
    vi.mocked(dependencies.accountImportService.loadContext).mockResolvedValue({
      accounts: [],
      holders: [
        { displayName: "淞文", userId: "user-1" },
        { displayName: "淞文", userId: "user-2" },
      ],
    });
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      ledgerId: "ledger-1",
      units,
      timeZoneOffsetMinutes: 0,
      userId: "user-1",
    });

    expect(
      dependencies.accountImportService.createAccount,
    ).not.toHaveBeenCalled();
    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(1);
    expect(result.details[0]).toMatchObject({ status: "failed" });
  });

  it("缺失二级分类时该行失败，且不会残留新建的一级分类", async () => {
    const units = unitsOf([incomeTable([incomeRow({ 二级分类: "" })])]);
    const dependencies = createDependencies();
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      ledgerId: "ledger-1",
      units,
      timeZoneOffsetMinutes: 0,
      userId: "user-1",
    });

    expect(
      dependencies.categoryImportService.createCategory,
    ).not.toHaveBeenCalled();
    expect(result.failureCount).toBe(1);
    expect(result.successCount).toBe(0);
    expect(result.details[0]).toMatchObject({ status: "failed" });
  });

  it("商家名称歧义时该行失败，且不会残留新建的商家标签", async () => {
    const units = unitsOf([incomeTable([incomeRow()])]);
    const dependencies = createDependencies();
    vi.mocked(dependencies.merchantImportService.loadContext).mockResolvedValue(
      {
        merchants: [
          { id: "merchant-1", matchNames: ["业务超市"], tagIds: [] },
          { id: "merchant-2", matchNames: ["业务超市"], tagIds: [] },
        ],
        tags: [],
      },
    );
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      ledgerId: "ledger-1",
      units,
      timeZoneOffsetMinutes: 0,
      userId: "user-1",
    });

    expect(dependencies.merchantImportService.createTag).not.toHaveBeenCalled();
    expect(result.failureCount).toBe(1);
    expect(result.successCount).toBe(0);
    expect(result.details[0]).toMatchObject({ status: "failed" });
  });

  it("单笔数据库失败不会阻断同批次后续记录", async () => {
    const units = unitsOf([
      incomeTable([
        incomeRow({ 商家: "商家A" }),
        incomeRow({ 商家: "商家B", 日期: "2026-09-17 11:00:00" }),
      ]),
    ]);
    const dependencies = createDependencies();
    vi.mocked(dependencies.transactionImportService.createNormal)
      .mockRejectedValueOnce(
        new RepositoryError("transaction_create_failed", "交易写入失败。"),
      )
      .mockResolvedValueOnce(undefined);
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      ledgerId: "ledger-1",
      units,
      timeZoneOffsetMinutes: 0,
      userId: "user-1",
    });

    expect(
      dependencies.transactionImportService.createNormal,
    ).toHaveBeenCalledTimes(2);
    expect(result.failureCount).toBe(1);
    expect(result.successCount).toBe(1);
    expect(result.details[0]).toMatchObject({
      reason: "交易写入失败。",
      rowNumbers: [2],
      status: "failed",
    });
  });

  it("只执行传入的这一批单元并返回本批统计", async () => {
    const rows = Array.from({ length: 3 }, (_, index) =>
      incomeRow({ 商家: `商家${index + 1}` }),
    );
    const units = unitsOf([incomeTable(rows)]);
    const dependencies = createDependencies();
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      ledgerId: "ledger-1",
      timeZoneOffsetMinutes: 0,
      units,
      userId: "user-1",
    });

    expect(result).toMatchObject({ processedCount: 3, successCount: 3 });
    expect(
      dependencies.transactionImportService.createNormal,
    ).toHaveBeenCalledTimes(3);
  });

  it("转账按两侧账户创建并调用转账写入接口", async () => {
    const units = unitsOf([
      transferTable([
        {
          交易类型: "转账",
          日期: "2026-09-17 12:00:00",
          转出账户: "钱包",
          转出账户币种: "JPY",
          转出账户持有人: "淞文",
          转入账户: "银行卡",
          转入账户币种: "JPY",
          转入账户持有人: "淞文",
          金额: "5000",
        },
      ]),
    ]);
    const dependencies = createDependencies();
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      ledgerId: "ledger-1",
      units,
      timeZoneOffsetMinutes: 0,
      userId: "user-1",
    });

    expect(
      dependencies.accountImportService.createAccount,
    ).toHaveBeenCalledTimes(2);
    expect(
      dependencies.transactionImportService.createTransfer,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: "account-钱包",
        transferAmount: 5000,
        transferTargetAccountId: "account-银行卡",
      }),
    );
    expect(result.successCount).toBe(1);
  });
});

describe("余额变更导入", () => {
  it("正负差值使用独立写入，失败不阻断后续行并正确汇总疑似重复", async () => {
    const d = createDependencies();
    vi.mocked(
      d.transactionImportService.createBalanceAdjustment,
    ).mockRejectedValueOnce(
      new RepositoryError("create_failed", "该条记录导入失败，请稍后重试。"),
    );
    vi.mocked(d.transactionImportService.hasPossibleBalanceAdjustmentDuplicate)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    const units = unitsOf([
      makeBalanceAdjustmentTable([
        { 金额: "100" },
        { 金额: "-20" },
        { 金额: "30" },
      ]),
    ]);
    const result = await createDataImportExecutionService(d).executeBatch({
      ledgerId: "ledger-1",
      userId: "user-1",
      timeZoneOffsetMinutes: -540,
      units,
    });
    expect(result).toMatchObject({
      successCount: 2,
      failureCount: 1,
      duplicateCount: 1,
      processedCount: 3,
    });
    expect(result.rowResults.map((row) => [row.sheet, row.status])).toEqual([
      ["balanceAdjustment", "failed"],
      ["balanceAdjustment", "duplicate"],
      ["balanceAdjustment", "success"],
    ]);
    expect(
      d.transactionImportService.createBalanceAdjustment,
    ).toHaveBeenCalledTimes(3);
    expect(
      d.transactionImportService.createBalanceAdjustment,
    ).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        signedDelta: -20,
        accountId: "account-现金",
        timeZoneOffsetMinutes: -540,
      }),
    );
    expect(d.accountImportService.createAccount).toHaveBeenCalledTimes(1);
    expect(d.accountImportService.createAccount).toHaveBeenCalledWith({
      ledgerId: "ledger-1",
      userId: "user-1",
      currency: "JPY",
      name: "现金",
      holder: null,
    });
  });
  it.each([false, true])(
    "归档账户不会误建同名账户；有效账户存在时优先使用：%s",
    async (active) => {
      const d = createDependencies();
      const archived = {
        id: "archived",
        isArchived: true,
        currency: "JPY",
        name: "现金",
        holder: null,
      };
      vi.mocked(d.accountImportService.loadContext).mockResolvedValue({
        accounts: [
          archived,
          ...(active ? [{ ...archived, id: "active", isArchived: false }] : []),
        ],
        holders: [],
      });
      const result = await createDataImportExecutionService(d).executeBatch({
        ledgerId: "ledger-1",
        userId: "user-1",
        timeZoneOffsetMinutes: 0,
        units: unitsOf([makeBalanceAdjustmentTable()]),
      });
      expect(result.successCount).toBe(active ? 1 : 0);
      expect(d.accountImportService.createAccount).not.toHaveBeenCalled();
      if (active)
        expect(
          d.transactionImportService.createBalanceAdjustment,
        ).toHaveBeenCalledWith(
          expect.objectContaining({ accountId: "active" }),
        );
      else {
        expect(
          d.transactionImportService.createBalanceAdjustment,
        ).not.toHaveBeenCalled();
        expect(result.details[0].reason).toBe(
          "该账户已归档，无法导入余额变更。",
        );
      }
    },
  );
  it("未知持有人按无持有人创建并显示警告", async () => {
    const d = createDependencies();
    const result = await createDataImportExecutionService(d).executeBatch({
      ledgerId: "ledger-1",
      userId: "user-1",
      timeZoneOffsetMinutes: 0,
      units: unitsOf([
        makeBalanceAdjustmentTable([{ 账户持有人: "陌生成员" }]),
      ]),
    });
    expect(result).toMatchObject({
      successCount: 1,
      failureCount: 0,
      holderMissingCount: 1,
    });
    expect(d.accountImportService.createAccount).toHaveBeenCalledWith(
      expect.objectContaining({ holder: null }),
    );
  });
});

describe("持有人映射", () => {
  function executeWithMapping(
    dependencies: ReturnType<typeof createDependencies>,
    units: ReturnType<typeof unitsOf>,
    holderMapping: ImportHolderMapping,
  ) {
    return createDataImportExecutionService(dependencies).executeBatch({
      holderMapping,
      ledgerId: "ledger-1",
      timeZoneOffsetMinutes: 0,
      units,
      userId: "user-1",
    });
  }

  it("未匹配姓名映射到账本成员后按该成员创建账户且不再警告", async () => {
    const dependencies = createDependencies();

    const result = await executeWithMapping(
      dependencies,
      unitsOf([incomeTable([incomeRow({ 账户持有人: "小明" })])]),
      { 小明: member("user-1") },
    );

    expect(
      dependencies.accountImportService.createAccount,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        holder: { kind: "member", userId: "user-1" },
      }),
    );
    expect(result).toMatchObject({
      failureCount: 0,
      holderMissingCount: 0,
      successCount: 1,
    });
    expect(result.details).toEqual([]);
  });

  it("明确映射为无持有人时按无持有人创建账户且不再警告", async () => {
    const dependencies = createDependencies();

    const result = await executeWithMapping(
      dependencies,
      unitsOf([incomeTable([incomeRow({ 账户持有人: "小明" })])]),
      { 小明: none },
    );

    expect(
      dependencies.accountImportService.createAccount,
    ).toHaveBeenCalledWith(expect.objectContaining({ holder: null }));
    expect(result).toMatchObject({ holderMissingCount: 0, successCount: 1 });
    expect(result.details).toEqual([]);
  });

  it("映射优先于按显示名匹配", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.accountImportService.loadContext).mockResolvedValue({
      accounts: [],
      holders: [
        { displayName: "淞文", userId: "user-1" },
        { displayName: "小红", userId: "user-2" },
      ],
    });

    await executeWithMapping(
      dependencies,
      unitsOf([incomeTable([incomeRow()])]),
      { 淞文: member("user-2") },
    );

    expect(
      dependencies.accountImportService.createAccount,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        holder: { kind: "member", userId: "user-2" },
      }),
    );
  });

  it("同显示名成员的歧义姓名有映射时不再失败", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.accountImportService.loadContext).mockResolvedValue({
      accounts: [],
      holders: [
        { displayName: "淞文", userId: "user-1" },
        { displayName: "淞文", userId: "user-2" },
      ],
    });

    const result = await executeWithMapping(
      dependencies,
      unitsOf([incomeTable([incomeRow()])]),
      { 淞文: member("user-2") },
    );

    expect(result).toMatchObject({ failureCount: 0, successCount: 1 });
    expect(
      dependencies.accountImportService.createAccount,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        holder: { kind: "member", userId: "user-2" },
      }),
    );
  });

  it("映射后命中已有账户时复用而不重复创建", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.accountImportService.loadContext).mockResolvedValue({
      accounts: [
        {
          currency: "JPY",
          holder: { kind: "member", userId: "user-1" },
          id: "account-existing",
          isArchived: false,
          name: "钱包",
        },
      ],
      holders: [{ displayName: "淞文", userId: "user-1" }],
    });

    const result = await executeWithMapping(
      dependencies,
      unitsOf([
        incomeTable([
          incomeRow({ 账户持有人: "小明" }),
          incomeRow({ 账户持有人: "小红", 日期: "2026-09-18 10:00:00" }),
        ]),
      ]),
      { 小明: member("user-1"), 小红: member("user-1") },
    );

    expect(
      dependencies.accountImportService.createAccount,
    ).not.toHaveBeenCalled();
    expect(
      dependencies.transactionImportService.createNormal,
    ).toHaveBeenCalledTimes(2);
    expect(
      dependencies.transactionImportService.createNormal,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: "account-existing" }),
    );
    expect(result.successCount).toBe(2);
  });

  it("多个姓名映射到同一成员时共用同一个新建账户", async () => {
    const dependencies = createDependencies();

    await executeWithMapping(
      dependencies,
      unitsOf([
        incomeTable([
          incomeRow({ 账户持有人: "小明" }),
          incomeRow({ 账户持有人: "小红", 日期: "2026-09-18 10:00:00" }),
        ]),
      ]),
      { 小明: member("user-1"), 小红: member("user-1") },
    );

    expect(
      dependencies.accountImportService.createAccount,
    ).toHaveBeenCalledTimes(1);
  });

  it("转账两侧持有人都应用映射", async () => {
    const dependencies = createDependencies();

    const result = await executeWithMapping(
      dependencies,
      unitsOf([
        transferTable([
          {
            交易类型: "转账",
            日期: "2026-09-17 10:00:00",
            转出账户: "钱包",
            转出账户币种: "JPY",
            转出账户持有人: "小明",
            转入账户: "银行卡",
            转入账户币种: "JPY",
            转入账户持有人: "小红",
            金额: "100",
          },
        ]),
      ]),
      { 小明: member("user-1"), 小红: none },
    );

    expect(
      vi
        .mocked(dependencies.accountImportService.createAccount)
        .mock.calls.map(([input]) => [input.name, input.holder]),
    ).toEqual([
      ["钱包", { kind: "member", userId: "user-1" }],
      ["银行卡", null],
    ]);
    expect(result).toMatchObject({ holderMissingCount: 0, successCount: 1 });
  });

  it("映射未覆盖的未匹配姓名仍按无持有人继续并警告", async () => {
    const dependencies = createDependencies();

    const result = await executeWithMapping(
      dependencies,
      unitsOf([incomeTable([incomeRow({ 账户持有人: "小明" })])]),
      { 小红: member("user-1") },
    );

    expect(result.holderMissingCount).toBe(1);
  });

  it("映射包含非账本成员的 userId 时整批拒绝且不写入任何数据", async () => {
    const dependencies = createDependencies();

    await expect(
      executeWithMapping(
        dependencies,
        unitsOf([incomeTable([incomeRow({ 账户持有人: "小明" })])]),
        { 小明: member("user-outsider") },
      ),
    ).rejects.toMatchObject({
      code: "reference_invalid",
      message: dataImportExecutionErrorMessages.holderMappingInvalid,
    });

    expectNoWrites(dependencies);
  });

  it("文件姓名与对象原型属性同名时不会被当作映射命中", async () => {
    const dependencies = createDependencies();

    const result = await executeWithMapping(
      dependencies,
      unitsOf([incomeTable([incomeRow({ 账户持有人: "constructor" })])]),
      {},
    );

    expect(result.holderMissingCount).toBe(1);
  });

  it("loadHolderMappingOptions 返回与校验映射一致的成员与待邀请成员", async () => {
    const dependencies = createDependencies();

    await expect(
      createDataImportExecutionService(dependencies).loadHolderMappingOptions({
        ledgerId: "ledger-1",
        userId: "user-1",
      }),
    ).resolves.toEqual({
      members: [{ displayName: "淞文", userId: "user-1" }],
      placeholders: [{ displayName: "奶奶", id: placeholderId }],
    });
    expect(
      dependencies.ledgerPlaceholderImportService.listUnclaimed,
    ).toHaveBeenCalledWith({ ledgerId: "ledger-1", userId: "user-1" });
  });
});

describe("待邀请成员映射", () => {
  const transferRow = {
    交易类型: "转账",
    日期: "2026-09-17 10:00:00",
    转出账户: "钱包",
    转出账户币种: "JPY",
    转出账户持有人: "外婆",
    转入账户: "银行卡",
    转入账户币种: "JPY",
    转入账户持有人: "奶奶",
    金额: "100",
  };

  function newPlaceholder(displayName: string) {
    return { displayName, kind: "newPlaceholder" } as const;
  }

  function placeholder(id: string) {
    return { kind: "placeholder", placeholderId: id } as const;
  }

  function execute(
    dependencies: ReturnType<typeof createDependencies>,
    units: ReturnType<typeof unitsOf>,
    holderMapping: ImportHolderMapping,
  ) {
    return createDataImportExecutionService(dependencies).executeBatch({
      holderMapping,
      ledgerId: "ledger-1",
      timeZoneOffsetMinutes: 0,
      units,
      userId: "user-1",
    });
  }

  it("本批的新建意图去重后只调用一次批量确保，并返回已解析的映射", async () => {
    const dependencies = createDependencies();

    const result = await execute(
      dependencies,
      unitsOf([
        incomeTable([
          incomeRow({ 账户持有人: "外婆" }),
          incomeRow({ 账户持有人: "外公", 日期: "2026-09-18 10:00:00" }),
          incomeRow({ 账户持有人: "外婆", 日期: "2026-09-19 10:00:00" }),
        ]),
      ]),
      {
        外公: newPlaceholder("外公"),
        外婆: newPlaceholder("外婆"),
        小明: member("user-1"),
        小红: none,
      },
    );

    expect(
      dependencies.ledgerPlaceholderImportService.ensureForImport,
    ).toHaveBeenCalledTimes(1);
    expect(
      dependencies.ledgerPlaceholderImportService.ensureForImport,
    ).toHaveBeenCalledWith({
      displayNames: ["外公", "外婆"],
      ledgerId: "ledger-1",
      userId: "user-1",
    });
    expect(result.resolvedHolderMapping).toEqual({
      外公: placeholder("new-外公"),
      外婆: placeholder("new-外婆"),
      小明: member("user-1"),
      小红: none,
    });
    expect(result).toMatchObject({
      createdPlaceholderCount: 2,
      holderMissingCount: 0,
      successCount: 3,
    });
    expect(
      vi
        .mocked(dependencies.accountImportService.createAccount)
        .mock.calls.map(([input]) => input.holder),
    ).toEqual([placeholder("new-外婆"), placeholder("new-外公")]);
  });

  it("批量确保复用了现有同名待邀请成员时不计入新建数", async () => {
    const dependencies = createDependencies();
    vi.mocked(
      dependencies.ledgerPlaceholderImportService.ensureForImport,
    ).mockResolvedValue(new Map([["奶奶", placeholderId.toUpperCase()]]));

    const result = await execute(
      dependencies,
      unitsOf([incomeTable([incomeRow({ 账户持有人: "奶奶" })])]),
      { 奶奶: newPlaceholder("奶奶") },
    );

    expect(result.createdPlaceholderCount).toBe(0);
    expect(result.resolvedHolderMapping).toEqual({
      奶奶: placeholder(placeholderId.toUpperCase()),
    });
  });

  it("后续批次提交已解析的映射时不再调用批量确保，只校验待邀请成员仍可用", async () => {
    const dependencies = createDependencies();

    const result = await execute(
      dependencies,
      unitsOf([incomeTable([incomeRow({ 账户持有人: "奶奶" })])]),
      { 奶奶: placeholder(placeholderId) },
    );

    expect(
      dependencies.ledgerPlaceholderImportService.ensureForImport,
    ).not.toHaveBeenCalled();
    expect(
      dependencies.ledgerPlaceholderImportService.listUnclaimed,
    ).toHaveBeenCalledWith({ ledgerId: "ledger-1", userId: "user-1" });
    expect(result).toMatchObject({
      createdPlaceholderCount: 0,
      holderMissingCount: 0,
      resolvedHolderMapping: { 奶奶: placeholder(placeholderId) },
      successCount: 1,
    });
    expect(
      dependencies.accountImportService.createAccount,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ holder: placeholder(placeholderId) }),
    );
  });

  it("映射里没有待邀请成员时不读取待邀请成员，也不调用批量确保", async () => {
    const dependencies = createDependencies();

    await execute(dependencies, unitsOf([incomeTable([incomeRow()])]), {
      小明: none,
    });

    expect(
      dependencies.ledgerPlaceholderImportService.listUnclaimed,
    ).not.toHaveBeenCalled();
    expect(
      dependencies.ledgerPlaceholderImportService.ensureForImport,
    ).not.toHaveBeenCalled();
  });

  it.each([
    [
      "不属于当前账本或已认领的待邀请成员",
      { 奶奶: placeholder("placeholder-x") },
    ],
    [
      "非账本成员（同批还有新建意图）",
      { 奶奶: newPlaceholder("奶奶"), 小明: member("user-outsider") },
    ],
    [
      "已失效的待邀请成员（同批还有新建意图）",
      { 奶奶: placeholder("placeholder-x"), 外婆: newPlaceholder("外婆") },
    ],
  ] as const)("映射包含%s时整批拒绝且不写入", async (_name, holderMapping) => {
    const dependencies = createDependencies();

    await expect(
      execute(
        dependencies,
        unitsOf([incomeTable([incomeRow({ 账户持有人: "奶奶" })])]),
        holderMapping,
      ),
    ).rejects.toMatchObject({
      code: "reference_invalid",
      message: dataImportExecutionErrorMessages.holderMappingInvalid,
    });
    expectNoWrites(dependencies);
  });

  it("非管理员提交新建意图时整批拒绝，不执行本批", async () => {
    const dependencies = createDependencies();
    const denied = new AuthorizationError(
      "permission_denied",
      getLedgerPlaceholderMemberErrorMessage("permission_denied")!,
    );
    vi.mocked(
      dependencies.ledgerPlaceholderImportService.ensureForImport,
    ).mockRejectedValue(denied);

    await expect(
      execute(
        dependencies,
        unitsOf([incomeTable([incomeRow({ 账户持有人: "奶奶" })])]),
        { 奶奶: newPlaceholder("奶奶") },
      ),
    ).rejects.toBe(denied);
    expect(
      dependencies.accountImportService.createAccount,
    ).not.toHaveBeenCalled();
    expect(
      dependencies.transactionImportService.createNormal,
    ).not.toHaveBeenCalled();
  });

  it.each([
    [
      "placeholder_name_member_conflict",
      dataImportExecutionErrorMessages.newPlaceholderMemberConflict(["淞文"]),
    ],
    [
      "placeholder_name_conflict",
      dataImportExecutionErrorMessages.newPlaceholderNameConflict,
    ],
  ] as const)(
    "批量确保返回 %s 时转换为导入的安全文案，不执行本批",
    async (code, message) => {
      const dependencies = createDependencies();
      vi.mocked(
        dependencies.ledgerPlaceholderImportService.ensureForImport,
      ).mockRejectedValue(
        new ConflictError(code, getLedgerPlaceholderMemberErrorMessage(code)!),
      );

      const failure = await execute(
        dependencies,
        unitsOf([
          incomeTable([
            incomeRow({ 账户持有人: "淞文" }),
            incomeRow({ 账户持有人: "外婆", 日期: "2026-09-18 10:00:00" }),
          ]),
        ]),
        { 外婆: newPlaceholder("外婆"), 淞文: newPlaceholder("淞文") },
      ).catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(ConflictError);
      expect(failure).toMatchObject({
        code: "holder_mapping_conflict",
        message,
      });
      expect(
        dependencies.accountImportService.createAccount,
      ).not.toHaveBeenCalled();
      expect(
        dependencies.categoryImportService.createCategory,
      ).not.toHaveBeenCalled();
      expect(
        dependencies.transactionImportService.createNormal,
      ).not.toHaveBeenCalled();
    },
  );

  it("同名同币种的成员、待邀请成员与无持有人账户各自独立复用", async () => {
    const dependencies = createDependencies();
    const account = { currency: "JPY", isArchived: false, name: "钱包" };
    vi.mocked(dependencies.accountImportService.loadContext).mockResolvedValue({
      accounts: [
        { ...account, holder: null, id: "account-none" },
        { ...account, holder: placeholder(placeholderId), id: "account-p" },
        { ...account, holder: member("user-1"), id: "account-m" },
      ],
      holders: [{ displayName: "淞文", userId: "user-1" }],
    });

    const result = await execute(
      dependencies,
      unitsOf([
        incomeTable([
          incomeRow({ 账户持有人: "奶奶" }),
          incomeRow({ 账户持有人: "淞文", 日期: "2026-09-18 10:00:00" }),
          incomeRow({ 账户持有人: "", 日期: "2026-09-19 10:00:00" }),
          incomeRow({ 账户持有人: "小红", 日期: "2026-09-20 10:00:00" }),
        ]),
      ]),
      { 奶奶: placeholder(placeholderId.toUpperCase()), 小红: none },
    );

    expect(
      dependencies.accountImportService.createAccount,
    ).not.toHaveBeenCalled();
    expect(
      vi
        .mocked(dependencies.transactionImportService.createNormal)
        .mock.calls.map(([input]) => input.accountId),
    ).toEqual(["account-p", "account-m", "account-none", "account-none"]);
    expect(result).toMatchObject({ holderMissingCount: 0, successCount: 4 });
  });

  it("待邀请成员账户不会被未映射、按无持有人继续的姓名误复用", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.accountImportService.loadContext).mockResolvedValue({
      accounts: [
        {
          currency: "JPY",
          holder: placeholder(placeholderId),
          id: "account-p",
          isArchived: false,
          name: "钱包",
        },
      ],
      holders: [],
    });

    const result = await execute(
      dependencies,
      unitsOf([incomeTable([incomeRow({ 账户持有人: "奶奶" })])]),
      {},
    );

    // 未映射的姓名保持 #780：警告并按无持有人继续，不按名字自动匹配待邀请成员。
    expect(result.holderMissingCount).toBe(1);
    expect(
      dependencies.accountImportService.createAccount,
    ).toHaveBeenCalledWith(expect.objectContaining({ holder: null }));
  });

  it("转账两侧与余额变更都应用待邀请成员映射", async () => {
    const dependencies = createDependencies();

    const result = await execute(
      dependencies,
      unitsOf([
        transferTable([transferRow]),
        makeBalanceAdjustmentTable([{ 账户持有人: "奶奶" }]),
      ]),
      { 外婆: newPlaceholder("外婆"), 奶奶: placeholder(placeholderId) },
    );

    expect(
      vi
        .mocked(dependencies.accountImportService.createAccount)
        .mock.calls.map(([input]) => [input.name, input.holder]),
    ).toEqual([
      ["钱包", placeholder("new-外婆")],
      ["银行卡", placeholder(placeholderId)],
      ["现金", placeholder(placeholderId)],
    ]);
    expect(result).toMatchObject({
      createdPlaceholderCount: 1,
      failureCount: 0,
      holderMissingCount: 0,
      successCount: 2,
    });
    expect(
      dependencies.transactionImportService.createBalanceAdjustment,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: "account-现金" }),
    );
  });
});
