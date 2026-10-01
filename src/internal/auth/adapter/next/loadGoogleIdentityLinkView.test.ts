// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadGoogleIdentityLinkView } from "internal/auth/adapter/next/loadGoogleIdentityLinkView";
import { googleIdentityLinkMessages } from "internal/auth/errors";
import { RepositoryError } from "internal/shared/errors/appError";

const mocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  getGoogleIdentityStatus: vi.fn(),
}));

vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));
vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));

const googleIdentity = {
  email: "user.google@gmail.test",
  linked: true,
  unlinkDisabledReason: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createServerRequestDependencies.mockResolvedValue({});
  mocks.createRequestContainer.mockReturnValue({
    auth: {
      service: { getGoogleIdentityStatus: mocks.getGoogleIdentityStatus },
    },
  });
  mocks.getGoogleIdentityStatus.mockResolvedValue(googleIdentity);
});

describe("loadGoogleIdentityLinkView", () => {
  it("从服务端读取绑定状态，没有回跳结果时不显示反馈", async () => {
    await expect(loadGoogleIdentityLinkView(undefined)).resolves.toEqual({
      googleIdentity,
      linkFeedback: null,
    });
  });

  it("绑定成功的回跳结果映射为成功反馈", async () => {
    await expect(loadGoogleIdentityLinkView("linked")).resolves.toMatchObject({
      linkFeedback: { kind: "success" },
    });
  });

  it.each([
    [
      "identity_already_exists",
      googleIdentityLinkMessages.identityAlreadyExists,
    ],
    ["cancelled", googleIdentityLinkMessages.cancelled],
    ["failed", googleIdentityLinkMessages.callbackFailed],
  ])(
    "回跳结果 %s 映射为 errors.ts 中的安全文案",
    async (linkResult, message) => {
      await expect(
        loadGoogleIdentityLinkView(linkResult),
      ).resolves.toMatchObject({ linkFeedback: { kind: "failure", message } });
    },
  );

  it("未知回跳结果不显示反馈", async () => {
    await expect(loadGoogleIdentityLinkView("<script>")).resolves.toMatchObject(
      { linkFeedback: null },
    );
  });

  it("读取失败时把错误交给页面错误边界", async () => {
    mocks.getGoogleIdentityStatus.mockRejectedValue(
      new RepositoryError(
        "identity_load_failed",
        googleIdentityLinkMessages.statusLoadFailed,
      ),
    );

    await expect(loadGoogleIdentityLinkView(undefined)).rejects.toBeInstanceOf(
      RepositoryError,
    );
  });
});
