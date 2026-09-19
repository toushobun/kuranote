// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  createDataExportFixture,
  createEmptyDataExport,
} from "test/mocks/dataExport";
import { createDataExportService } from "./dataExportService";

function setup(data = createDataExportFixture()) {
  const dependencies = {
    accountQueryService: {
      findExportSummaries: vi.fn().mockResolvedValue(data.accounts),
    },
    categoryQueryService: {
      findSummariesByIds: vi.fn().mockResolvedValue(data.categories),
      listActiveSummaries: vi.fn(),
    },
    merchantQueryService: {
      findExportSummaries: vi.fn().mockResolvedValue(data.merchants),
    },
    transactionQueryService: {
      listAllForExport: vi.fn().mockResolvedValue(data.records),
    },
  };
  return { ...dependencies, service: createDataExportService(dependencies) };
}
const input = { ledgerId: "ledger", userId: "user" };
describe("dataExportService", () => {
  it("通过公开窄接口按交易关联去重加载资料，并传递同一账本与用户", async () => {
    const {
      service,
      accountQueryService,
      categoryQueryService,
      merchantQueryService,
    } = setup();
    await expect(service.getData(input)).resolves.toEqual(
      createDataExportFixture(),
    );
    expect(accountQueryService.findExportSummaries).toHaveBeenCalledWith({
      ...input,
      accountIds: ["cash", "bank", "none"],
    });
    expect(categoryQueryService.findSummariesByIds).toHaveBeenCalledWith({
      ...input,
      categoryIds: ["lunch", "food", "salary"],
    });
    expect(merchantQueryService.findExportSummaries).toHaveBeenCalledWith({
      ...input,
      merchantIds: ["shop"],
    });
  });
  it("空账本不读取主数据，仍返回完整空结果", async () => {
    const { service, accountQueryService } = setup(createEmptyDataExport());
    await expect(service.getData(input)).resolves.toEqual(
      createEmptyDataExport(),
    );
    expect(accountQueryService.findExportSummaries).not.toHaveBeenCalled();
  });
  it("账户标识一次性交给账户查询服务，由其负责分批", async () => {
    const data = createDataExportFixture();
    data.records[0].items = Array.from({ length: 201 }, (_, index) => ({
      ...data.records[0].items[0],
      accountId: `account-${index}`,
    }));
    const { service, accountQueryService } = setup(data);
    await service.getData(input);
    expect(
      accountQueryService.findExportSummaries.mock.calls.map(
        ([input]) => input.accountIds.length,
      ),
    ).toEqual([204]);
  });
});
