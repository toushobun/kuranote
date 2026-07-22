// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { merchantErrorCodes } from "server/merchant/errors";
import { RepositoryError } from "server/shared/errors/appError";

const mocks = vi.hoisted(() => ({
  archiveAlias: vi.fn(),
  archiveMerchant: vi.fn(),
  createAlias: vi.fn(),
  createMerchant: vi.fn(),
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  redirect: vi.fn(),
  requireCurrentUserAndLedger: vi.fn(),
  revalidateMerchantMutation: vi.fn(),
  updateMerchant: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("server/ledger/adapter/next/currentLedger", () => ({
  requireCurrentUserAndLedger: mocks.requireCurrentUserAndLedger,
}));
vi.mock("server/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));
vi.mock("server/merchant/adapter/next/revalidate", () => ({
  revalidateMerchantMutation: mocks.revalidateMerchantMutation,
}));
vi.mock("server/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));

import {
  archiveMerchantAlias,
  createMerchant,
  updateMerchant,
} from "server/merchant/adapter/next/actions";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const merchantId = "00000000-0000-4000-8000-000000001001";
const aliasId = "00000000-0000-4000-8000-000000001002";

function merchantForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("merchantId", merchantId);
  formData.set("aliasId", aliasId);
  formData.set("name", "LIFE");
  formData.set("websiteUrl", "https://example.com");
  formData.set("note", "常用超市");
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.redirect.mockImplementation((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  });
  mocks.requireCurrentUserAndLedger.mockResolvedValue({
    currentLedger: { id: ledgerId },
  });
  mocks.createServerRequestDependencies.mockResolvedValue({});
  mocks.createRequestContainer.mockReturnValue({
    merchant: {
      service: {
        archiveAlias: mocks.archiveAlias,
        archiveMerchant: mocks.archiveMerchant,
        createAlias: mocks.createAlias,
        createMerchant: mocks.createMerchant,
        findSummariesByIds: vi.fn(),
        getView: vi.fn(),
        listActiveOptions: vi.fn(),
        updateMerchant: mocks.updateMerchant,
      },
    },
  });
});

describe("Merchant Server Actions", () => {
  it("创建成功后调用模块级缓存失效并跳回商家页", async () => {
    await expect(createMerchant(merchantForm())).rejects.toThrow(
      "NEXT_REDIRECT:/merchants",
    );

    expect(mocks.createMerchant).toHaveBeenCalledWith({
      ledgerId,
      name: "LIFE",
      note: "常用超市",
      siteUrl: "https://example.com",
    });
    expect(mocks.revalidateMerchantMutation).toHaveBeenCalledOnce();
  });

  it("创建表单无效时不创建请求依赖也不失效缓存", async () => {
    await expect(createMerchant(merchantForm({ name: "" }))).rejects.toThrow(
      "NEXT_REDIRECT:/merchants?error=name_required",
    );

    expect(mocks.createServerRequestDependencies).not.toHaveBeenCalled();
    expect(mocks.createMerchant).not.toHaveBeenCalled();
    expect(mocks.revalidateMerchantMutation).not.toHaveBeenCalled();
  });

  it("内部 Repository 错误映射为当前操作错误且不失效缓存", async () => {
    mocks.createMerchant.mockRejectedValue(
      new RepositoryError("merchant_write_failed", "写入失败"),
    );

    await expect(createMerchant(merchantForm())).rejects.toThrow(
      "NEXT_REDIRECT:/merchants?error=create_failed",
    );
    expect(mocks.revalidateMerchantMutation).not.toHaveBeenCalled();
  });

  it("更新失败保留 merchantId 并不失效缓存", async () => {
    mocks.updateMerchant.mockRejectedValue(
      new RepositoryError(merchantErrorCodes.updateFailed, "更新失败"),
    );

    await expect(updateMerchant(merchantForm())).rejects.toThrow(
      `NEXT_REDIRECT:/merchants?error=update_failed&merchantId=${merchantId}`,
    );
    expect(mocks.revalidateMerchantMutation).not.toHaveBeenCalled();
  });

  it("别名归档失败从错误详情恢复 merchantId", async () => {
    mocks.archiveAlias.mockRejectedValue(
      new RepositoryError(merchantErrorCodes.aliasArchiveFailed, "归档失败", {
        details: { merchantId },
      }),
    );

    await expect(archiveMerchantAlias(merchantForm())).rejects.toThrow(
      `NEXT_REDIRECT:/merchants?error=alias_archive_failed&merchantId=${merchantId}`,
    );
    expect(mocks.revalidateMerchantMutation).not.toHaveBeenCalled();
  });
});
