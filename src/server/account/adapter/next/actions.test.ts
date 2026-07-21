// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  archiveAccount,
  createAccount,
  updateAccount,
} from "server/account/adapter/next/actions";
import { AuthorizationError } from "server/shared/errors/appError";

const mocks = vi.hoisted(() => ({
  archive: vi.fn(),
  create: vi.fn(),
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  getCurrentLedgerContext: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  revalidatePath: vi.fn(),
  update: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("lib/ledger/current-ledger", () => ({
  getCurrentLedgerContext: mocks.getCurrentLedgerContext,
}));
vi.mock("server/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));
vi.mock("server/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const holderUserId = "00000000-0000-4000-8000-000000000041";
const accountId = "00000000-0000-4000-8000-000000000045";

function createFormData() {
  const formData = new FormData();
  formData.set("name", "现金");
  formData.set("type", "cash");
  formData.set("currency", "jpy");
  formData.set("initialBalance", "1000");
  formData.append("holderUserIds", holderUserId);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentLedgerContext.mockResolvedValue({
    currentLedger: {
      baseCurrency: "JPY",
      currentUserRole: "owner",
      id: ledgerId,
      name: "家庭账本",
    },
    userId,
  });
  mocks.createServerRequestDependencies.mockResolvedValue({});
  mocks.createRequestContainer.mockReturnValue({
    account: {
      service: {
        archive: mocks.archive,
        create: mocks.create,
        getView: vi.fn(),
        update: mocks.update,
      },
    },
  });
  mocks.create.mockResolvedValue({ accountId });
  mocks.archive.mockResolvedValue(undefined);
  mocks.update.mockResolvedValue(undefined);
});

describe("Account Server Actions", () => {
  it("创建账户时忽略客户端伪造的 ledgerId 并复用模块缓存失效", async () => {
    const formData = createFormData();
    formData.set("ledgerId", "00000000-0000-4000-8000-000000000099");

    await expect(createAccount({}, formData)).rejects.toThrow(
      "NEXT_REDIRECT:/accounts?result=created",
    );

    expect(mocks.create).toHaveBeenCalledWith({
      currency: "JPY",
      holderUserIds: [holderUserId],
      initialBalance: 1000,
      ledgerId,
      name: "现金",
      type: "cash",
      userId,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/accounts");
  });

  it("更新账户成功后跳回账户页面", async () => {
    const formData = createFormData();
    formData.set("accountId", accountId);
    formData.delete("initialBalance");

    await expect(updateAccount({}, formData)).rejects.toThrow(
      "NEXT_REDIRECT:/accounts?result=updated",
    );
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ accountId, ledgerId, userId }),
    );
  });

  it("归档账户成功后传递 current ledger 并刷新账户页面", async () => {
    const formData = new FormData();
    formData.set("accountId", accountId);

    await expect(archiveAccount({}, formData)).rejects.toThrow(
      "NEXT_REDIRECT:/accounts?result=archived",
    );

    expect(mocks.archive).toHaveBeenCalledWith({
      accountId,
      ledgerId,
      userId,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/accounts");
  });

  it("表单参数无效时不创建账户也不触发缓存失效", async () => {
    const formData = createFormData();
    formData.delete("holderUserIds");

    await expect(createAccount({}, formData)).resolves.toEqual({
      error: "账户持有人指定不正确。",
      errorKey: expect.any(String),
    });

    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("归档账户失败时保留安全错误码且不触发缓存失效", async () => {
    mocks.archive.mockRejectedValue(
      new AuthorizationError("permission_denied", "没有权限"),
    );
    const formData = new FormData();
    formData.set("accountId", accountId);

    await expect(archiveAccount({}, formData)).resolves.toEqual({
      error: "没有权限",
      errorKey: expect.any(String),
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
