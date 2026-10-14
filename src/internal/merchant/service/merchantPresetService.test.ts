// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { getLedgerSetupTemplate } from "internal/ledger";
import { createMerchantPresetService } from "./merchantPresetService";
import {
  AuthorizationError,
  ValidationError,
} from "internal/shared/errors/appError";

function setup(currency = "JPY", existingNames: string[] = []) {
  const repository = {
    getCurrency: vi.fn().mockResolvedValue(currency),
    listExistingNames: vi.fn().mockResolvedValue(existingNames),
    add: vi.fn().mockResolvedValue(1),
  };
  const merchantService = { assertCanManage: vi.fn() };
  const service = createMerchantPresetService({ repository, merchantService });
  return { service, repository, merchantService };
}
const template = getLedgerSetupTemplate("JPY")!;
const preset = template.merchants.find(
  ({ aliases, websiteUrl }) => aliases.length > 0 && websiteUrl,
)!;
const input = {
  currency: "JPY",
  templateVersion: template.version,
  selectedKeys: [preset.key],
};

describe("merchantPresetService", () => {
  it.each([
    { ...input, selectedKeys: ["not-a-key"] },
    { ...input, currency: "USD" },
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
  it("以数据库当前币种为准，拒绝已经修改币种的旧弹框", async () => {
    const { service } = setup("USD");
    await expect(service.add("ledger", input)).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
  it.each([preset.name.toUpperCase(), preset.aliases[0]!.alias.toUpperCase()])(
    "名称或别名忽略大小写匹配后跳过，不补现有资料：%s",
    async (name) => {
      const { service, repository } = setup("JPY", [name]);
      await service.add("ledger", input);
      expect(repository.add).toHaveBeenCalledWith({
        ledgerId: "ledger",
        currency: "JPY",
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
    expect(repository.getCurrency).not.toHaveBeenCalled();
    expect(repository.add).not.toHaveBeenCalled();
  });
  it("没有模板时返回空模板选项", async () => {
    await expect(setup("USD").service.load("ledger")).resolves.toEqual({
      currency: "USD",
      addedKeys: [],
      template: null,
    });
  });
});
