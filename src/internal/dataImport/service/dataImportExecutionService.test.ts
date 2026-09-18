import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AccountImportService } from "internal/account";
import type { CategoryImportService } from "internal/category";
import type { ParsedTable } from "internal/dataImport/entity/parsedTable";
import {
  incomeExpenseColumns,
  transferColumns,
} from "internal/dataImport/schema";
import { createDataImportExecutionService } from "internal/dataImport/service/dataImportExecutionService";
import type { MerchantImportService } from "internal/merchant";
import { RepositoryError } from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";
import type { TransactionImportService } from "internal/transaction";

const parseImportFileMock = vi.hoisted(() => vi.fn());

vi.mock("internal/dataImport/util/parseImportFile", () => ({
  parseImportFile: parseImportFileMock,
}));

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
    createNormal: vi.fn(async () => undefined),
    createTransfer: vi.fn(async () => undefined),
    hasPossibleNormalDuplicate: vi.fn(async () => false),
    hasPossibleTransferDuplicate: vi.fn(async () => false),
  };
  const logger: Logger = {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };

  return {
    accountImportService,
    categoryImportService,
    logger,
    merchantImportService,
    transactionImportService,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DataImportExecutionService", () => {
  it.each([null, "user-1"])(
    "同名同持有人 %s 的账户按币种匹配收支与转账",
    async (holderUserId) => {
      const holderName = holderUserId ? "淞文" : "";
      parseImportFileMock.mockResolvedValue({
        ok: true,
        tables: [
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
        ],
      });
      const dependencies = createDependencies();
      vi.mocked(
        dependencies.accountImportService.loadContext,
      ).mockResolvedValue({
        accounts: ["钱包", "银行卡"].flatMap((name) =>
          ["USD", "JPY"].map((currency) => ({
            currency,
            holderUserId,
            id: `${name}-${currency}`,
            name,
          })),
        ),
        holders: [{ displayName: "淞文", userId: "user-1" }],
      });
      const result = await createDataImportExecutionService(
        dependencies,
      ).executeBatch({
        fileBuffer: new ArrayBuffer(1),
        fileName: "data.xlsx",
        ledgerId: "ledger-1",
        offset: 0,
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
      parseImportFileMock.mockResolvedValue({
        ok: true,
        tables: [incomeTable([incomeRow(), incomeRow({ 商家: "另一个商家" })])],
      });
      const dependencies = createDependencies();
      vi.mocked(
        dependencies.accountImportService.loadContext,
      ).mockResolvedValue({
        accounts: ["account-1", "account-2"].map((id) => ({
          currency: ambiguous ? "JPY" : "USD",
          holderUserId: "user-1",
          id,
          name: "钱包",
        })),
        holders: [{ displayName: "淞文", userId: "user-1" }],
      });
      const result = await createDataImportExecutionService(
        dependencies,
      ).executeBatch({
        fileBuffer: new ArrayBuffer(1),
        fileName: "data.xlsx",
        ledgerId: "ledger-1",
        offset: 0,
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
            holderUserId: "user-1",
            name: "钱包",
          }),
        );
      }
    },
  );

  it("缺失的分类、商家标签、商家和账户会自动创建后写入交易", async () => {
    parseImportFileMock.mockResolvedValue({
      ok: true,
      tables: [incomeTable([incomeRow()])],
    });
    const dependencies = createDependencies();
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      fileBuffer: new ArrayBuffer(1),
      fileName: "data.xlsx",
      ledgerId: "ledger-1",
      offset: 0,
      timeZoneOffsetMinutes: 0,
      userId: "user-1",
    });

    expect(
      dependencies.accountImportService.createAccount,
    ).toHaveBeenCalledWith({
      currency: "JPY",
      holderUserId: "user-1",
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
      done: true,
      duplicateCount: 0,
      failureCount: 0,
      processedCount: 1,
      successCount: 1,
      totalCount: 1,
    });
  });

  it("疑似重复仍继续写入并单独统计警告", async () => {
    parseImportFileMock.mockResolvedValue({
      ok: true,
      tables: [incomeTable([incomeRow()])],
    });
    const dependencies = createDependencies();
    vi.mocked(
      dependencies.transactionImportService.hasPossibleNormalDuplicate,
    ).mockResolvedValue(true);
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      fileBuffer: new ArrayBuffer(1),
      fileName: "data.xlsx",
      ledgerId: "ledger-1",
      offset: 0,
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
    parseImportFileMock.mockResolvedValue({
      ok: true,
      tables: [incomeTable([incomeRow({ 账户持有人: "小明" })])],
    });
    const dependencies = createDependencies();
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      fileBuffer: new ArrayBuffer(1),
      fileName: "data.xlsx",
      ledgerId: "ledger-1",
      offset: 0,
      timeZoneOffsetMinutes: 0,
      userId: "user-1",
    });

    expect(
      dependencies.accountImportService.createAccount,
    ).toHaveBeenCalledWith(expect.objectContaining({ holderUserId: null }));
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
    parseImportFileMock.mockResolvedValue({
      ok: true,
      tables: [
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
      ],
    });
    const dependencies = createDependencies();
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      fileBuffer: new ArrayBuffer(1),
      fileName: "data.xlsx",
      ledgerId: "ledger-1",
      offset: 0,
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
    parseImportFileMock.mockResolvedValue({
      ok: true,
      tables: [
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
      ],
    });
    const dependencies = createDependencies();
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      fileBuffer: new ArrayBuffer(1),
      fileName: "data.xlsx",
      ledgerId: "ledger-1",
      offset: 0,
      timeZoneOffsetMinutes: 0,
      userId: "user-1",
    });

    expect(result.holderMissingCount).toBe(1);
    const occurrences = result.details[0]?.reason.split("小明").length ?? 0;
    expect(occurrences - 1).toBe(1);
  });

  it("账本内存在多个同显示名成员时该行判定为失败", async () => {
    parseImportFileMock.mockResolvedValue({
      ok: true,
      tables: [incomeTable([incomeRow()])],
    });
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
      fileBuffer: new ArrayBuffer(1),
      fileName: "data.xlsx",
      ledgerId: "ledger-1",
      offset: 0,
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
    parseImportFileMock.mockResolvedValue({
      ok: true,
      tables: [incomeTable([incomeRow({ 二级分类: "" })])],
    });
    const dependencies = createDependencies();
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      fileBuffer: new ArrayBuffer(1),
      fileName: "data.xlsx",
      ledgerId: "ledger-1",
      offset: 0,
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
    parseImportFileMock.mockResolvedValue({
      ok: true,
      tables: [incomeTable([incomeRow()])],
    });
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
      fileBuffer: new ArrayBuffer(1),
      fileName: "data.xlsx",
      ledgerId: "ledger-1",
      offset: 0,
      timeZoneOffsetMinutes: 0,
      userId: "user-1",
    });

    expect(dependencies.merchantImportService.createTag).not.toHaveBeenCalled();
    expect(result.failureCount).toBe(1);
    expect(result.successCount).toBe(0);
    expect(result.details[0]).toMatchObject({ status: "failed" });
  });

  it("单笔数据库失败不会阻断同批次后续记录", async () => {
    parseImportFileMock.mockResolvedValue({
      ok: true,
      tables: [
        incomeTable([
          incomeRow({ 商家: "商家A" }),
          incomeRow({ 商家: "商家B", 日期: "2026-09-17 11:00:00" }),
        ]),
      ],
    });
    const dependencies = createDependencies();
    vi.mocked(dependencies.transactionImportService.createNormal)
      .mockRejectedValueOnce(
        new RepositoryError("transaction_create_failed", "交易写入失败。"),
      )
      .mockResolvedValueOnce(undefined);
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      fileBuffer: new ArrayBuffer(1),
      fileName: "data.xlsx",
      ledgerId: "ledger-1",
      offset: 0,
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

  it("每次只处理固定批次并返回下一批 offset", async () => {
    const rows = Array.from({ length: 26 }, (_, index) =>
      incomeRow({
        日期: `2026-09-17 ${String(index % 24).padStart(2, "0")}:00:00`,
        商家: `商家${index + 1}`,
      }),
    );
    parseImportFileMock.mockResolvedValue({
      ok: true,
      tables: [incomeTable(rows)],
    });
    const dependencies = createDependencies();
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      fileBuffer: new ArrayBuffer(1),
      fileName: "data.xlsx",
      ledgerId: "ledger-1",
      offset: 0,
      timeZoneOffsetMinutes: 0,
      userId: "user-1",
    });

    expect(result).toMatchObject({
      done: false,
      nextOffset: 25,
      processedCount: 25,
      totalCount: 26,
    });
    expect(
      dependencies.transactionImportService.createNormal,
    ).toHaveBeenCalledTimes(25);
  });

  it("转账按两侧账户创建并调用转账写入接口", async () => {
    parseImportFileMock.mockResolvedValue({
      ok: true,
      tables: [
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
      ],
    });
    const dependencies = createDependencies();
    const service = createDataImportExecutionService(dependencies);

    const result = await service.executeBatch({
      fileBuffer: new ArrayBuffer(1),
      fileName: "data.xlsx",
      ledgerId: "ledger-1",
      offset: 0,
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
