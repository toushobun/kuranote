import { describe, expect, it, vi } from "vitest";

import { createMerchantImportService } from "internal/merchant/service/merchantImportService";
import type { MerchantService } from "internal/merchant/service/merchantService";

function merchant(overrides: Record<string, unknown> = {}) {
  return {
    aliases: [],
    display_name: "业务超市",
    id: "merchant-1",
    name: "业务超市",
    note: null,
    tags: [{ id: "tag-1" }],
    website_url: null,
    ...overrides,
  };
}

function createService(overrides: Partial<MerchantService> = {}) {
  const list = vi.fn(async () => ({
    merchants: [merchant()],
    tags: [{ id: "tag-1", name: "超市" }],
  }));
  const getMerchant = vi.fn(async () => merchant());
  const updateMerchant = vi.fn(async () => true);
  const createMerchant = vi.fn(async () => "merchant-new");
  const createTag = vi.fn(async () => "tag-new");
  const service = {
    createMerchant,
    createTag,
    getMerchant,
    list,
    updateMerchant,
    ...overrides,
  } as unknown as MerchantService;

  return {
    createMerchant,
    createTag,
    getMerchant,
    importService: createMerchantImportService(service),
    list,
    updateMerchant,
  };
}

describe("MerchantImportService", () => {
  it("loadContext 将商家别名与显示名合并为去重后的匹配名列表", async () => {
    const { importService } = createService();

    const context = await importService.loadContext({ ledgerId: "ledger-1" });

    expect(context).toEqual({
      merchants: [
        { id: "merchant-1", matchNames: ["业务超市"], tagIds: ["tag-1"] },
      ],
      tags: [{ id: "tag-1", name: "超市" }],
    });
  });

  it("loadContext 合并商家名、显示名与别名，去除重复项", async () => {
    const { importService } = createService({
      list: vi.fn(async () => ({
        merchants: [
          merchant({
            aliases: [{ alias: "业务超市" }, { alias: "業務スーパー" }],
            display_name: "業務スーパー",
          }),
        ],
        tags: [],
      })),
    } as never);

    const context = await importService.loadContext({ ledgerId: "ledger-1" });

    expect(context.merchants[0].matchNames).toEqual([
      "业务超市",
      "業務スーパー",
    ]);
  });

  it("createMerchant 委托 Service 写入并直接返回新商家 id，不重新查询", async () => {
    const { createMerchant, importService, list } = createService();

    const result = await importService.createMerchant({
      ledgerId: "ledger-1",
      name: "新商家",
      tagIds: ["tag-1"],
    });

    expect(createMerchant).toHaveBeenCalledWith({
      ledgerId: "ledger-1",
      name: "新商家",
      note: null,
      previewIconUrl: null,
      siteUrl: null,
      tagIds: ["tag-1"],
    });
    expect(result).toEqual({ merchantId: "merchant-new" });
    expect(list).not.toHaveBeenCalled();
  });

  it("createTag 委托 Service 写入并直接返回新标签 id，不重新查询", async () => {
    const { createTag, importService, list } = createService();

    const result = await importService.createTag({
      ledgerId: "ledger-1",
      name: "便利店",
    });

    expect(createTag).toHaveBeenCalledWith(
      expect.objectContaining({ ledgerId: "ledger-1", name: "便利店" }),
    );
    expect(result).toEqual({ tagId: "tag-new" });
    expect(list).not.toHaveBeenCalled();
  });

  it("addTag 已挂载该标签时不重复写入", async () => {
    const { getMerchant, importService, updateMerchant } = createService();

    await importService.addTag({
      ledgerId: "ledger-1",
      merchantId: "merchant-1",
      tagId: "tag-1",
    });

    expect(getMerchant).toHaveBeenCalledWith({
      ledgerId: "ledger-1",
      merchantId: "merchant-1",
    });
    expect(updateMerchant).not.toHaveBeenCalled();
  });

  it("addTag 追加新标签时保留既有标签并写入", async () => {
    const { importService, updateMerchant } = createService();

    await importService.addTag({
      ledgerId: "ledger-1",
      merchantId: "merchant-1",
      tagId: "tag-2",
    });

    expect(updateMerchant).toHaveBeenCalledWith({
      ledgerId: "ledger-1",
      merchantId: "merchant-1",
      name: "业务超市",
      note: null,
      previewIconUrl: null,
      siteUrl: null,
      tagIds: ["tag-1", "tag-2"],
    });
  });
});
