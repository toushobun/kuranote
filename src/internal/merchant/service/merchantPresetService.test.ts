// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { getLedgerSetupTemplate } from "internal/ledger";
import { buildMerchantChecklist } from "utils/merchantPresets";
import { createMerchantPresetService } from "./merchantPresetService";
import {
  AuthorizationError,
  ValidationError,
} from "internal/shared/errors/appError";

function setup(
  region: "jp" | "cn" | null = "jp",
  existingNames: string[] = [],
) {
  const repository = {
    getRegion: vi.fn().mockResolvedValue(region),
    listExistingNames: vi
      .fn()
      .mockResolvedValue({ names: existingNames, aliases: existingNames }),
    add: vi.fn().mockResolvedValue(1),
  };
  const merchantService = { assertCanManage: vi.fn() };
  const service = createMerchantPresetService({
    repository,
    merchantService,
    templateService: { getTemplate: getLedgerSetupTemplate },
  });
  return { service, repository, merchantService };
}
const template = getLedgerSetupTemplate("jp")!;
const preset = template.merchants.find(
  ({ aliases, websiteUrl }) => aliases.length > 0 && websiteUrl,
)!;
const input = {
  regions: ["jp"] as ("jp" | "cn")[],
  templateVersion: template.version,
  selectedKeys: [preset.key],
};

describe("merchantPresetService", () => {
  it("中国地区可添加中国独有商家和共用商家，与账本币种无关", async () => {
    const { service, repository } = setup("cn");
    await service.add("ledger", {
      regions: ["cn"],
      templateVersion: 4,
      selectedKeys: ["hema", "starbucks"],
    });
    expect(repository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          merchants: expect.arrayContaining([
            expect.objectContaining({ name: "盒马" }),
            expect.objectContaining({ name: "星巴克" }),
          ]),
        }),
      }),
    );
  });
  it("歧义别名不误判另一地区商家已添加", async () => {
    const { service, repository } = setup("jp", ["邮局"]);
    await service.add("ledger", {
      regions: ["cn"],
      templateVersion: 4,
      selectedKeys: ["china_post"],
    });
    expect(repository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          merchants: [
            expect.objectContaining({
              name: "中国邮政",
              matchNames: expect.not.arrayContaining(["邮局"]),
            }),
          ],
        }),
      }),
    );
  });
  it.each([
    { ...input, regions: ["cn"] as ("jp" | "cn")[], selectedKeys: ["aeon"] },
    { ...input, selectedKeys: ["not-a-key"] },
    { ...input, templateVersion: -1 },
    { ...input, templateVersion: 999 },
    { ...input, selectedKeys: [] },
    { ...input, name: "客户端伪造名称" },
  ])("拒绝非法 key、币种、版本与额外商家资料：%j", async (value) => {
    const { service, repository } = setup();
    await expect(service.add("ledger", value)).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(repository.add).not.toHaveBeenCalled();
  });
  it("未知历史地区可以显式选择地区添加，不依赖币种", async () => {
    const { service } = setup(null);
    await expect(service.add("ledger", input)).resolves.toBe(1);
  });
  it.each([preset.name.toUpperCase(), preset.aliases[0]!.alias.toUpperCase()])(
    "名称或别名忽略大小写匹配后跳过，不补现有资料：%s",
    async (name) => {
      const { service, repository } = setup("jp", [name]);
      await service.add("ledger", input);
      expect(repository.add).toHaveBeenCalledWith({
        ledgerId: "ledger",
        payload: { merchants: [], merchantTags: [] },
      });
    },
  );
  it("去重 key 后仅用模板构建官网、别名、头像与全部标签", async () => {
    const { service, repository } = setup();
    await service.add("ledger", {
      ...input,
      selectedKeys: [preset.key, preset.key],
    });
    const payload = repository.add.mock.calls[0]![0].payload;
    expect(payload.merchants).toHaveLength(1);
    expect(payload.merchants[0]).toMatchObject({
      name: preset.name,
      websiteUrl: preset.websiteUrl,
      aliases: preset.aliases,
      tagKeys: preset.tagKeys,
      iconUrl: expect.stringContaining("https://www.google.com/s2/favicons?"),
    });
    expect(
      payload.merchantTags.map((tag: { key: string }) => tag.key).sort(),
    ).toEqual([...preset.tagKeys].sort());
  });
  it("权限拒绝时不读取模板上下文，也不写入", async () => {
    const { service, repository, merchantService } = setup();
    merchantService.assertCanManage.mockRejectedValue(
      new AuthorizationError("permission_denied", "没有管理商家的权限"),
    );
    await expect(service.add("ledger", input)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
    expect(repository.getRegion).not.toHaveBeenCalled();
    expect(repository.add).not.toHaveBeenCalled();
  });
  it("加载仅返回币种、版本、勾选列表与已添加 key，不返回写入资料", async () => {
    const { service, merchantService } = setup("jp", [
      preset.aliases[0]!.alias.toUpperCase(),
    ]);
    const options = await service.load("ledger");
    expect(options).toEqual({
      region: "jp",
      templateVersion: template.version,
      ...buildMerchantChecklist(template),
      addedKeys: expect.arrayContaining([preset.key]),
    });
    expect(Object.keys(options).sort()).toEqual([
      "addedKeys",
      "groups",
      "items",
      "region",
      "templateVersion",
    ]);
    expect(JSON.stringify(options)).not.toContain('"aliases"');
    expect(merchantService.assertCanManage).toHaveBeenCalledWith({
      ledgerId: "ledger",
    });
  });
  it("加载同样校验管理权限，拒绝后不读取数据", async () => {
    const { service, repository, merchantService } = setup();
    merchantService.assertCanManage.mockRejectedValue(
      new AuthorizationError("permission_denied", "没有管理商家的权限"),
    );
    await expect(service.load("ledger")).rejects.toBeInstanceOf(
      AuthorizationError,
    );
    expect(repository.getRegion).not.toHaveBeenCalled();
    expect(repository.listExistingNames).not.toHaveBeenCalled();
  });
  it("历史地区未知时提供完整目录并要求先选择地区", async () => {
    const options = await setup(null).service.load("ledger");
    expect(options.region).toBeNull();
    expect(options.items).toHaveLength(194);
    expect(options.templateVersion).toBe(4);
  });
});
