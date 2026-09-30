// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { routePaths } from "config/paths";
import {
  revalidateTransactionColorSchemeMutation,
  revalidateUserProfileMutation,
} from "internal/user/adapter/next/revalidate";

const mocks = vi.hoisted(() => ({ revalidatePath: vi.fn() }));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

describe("revalidateTransactionColorSchemeMutation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("只失效 App 偏好设置页", () => {
    revalidateTransactionColorSchemeMutation();

    expect(mocks.revalidatePath).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      routePaths.settingsPreferences,
    );
  });
});

describe("revalidateUserProfileMutation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("失效显示昵称或头像的页面，包括个人主页", () => {
    revalidateUserProfileMutation();

    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      routePaths.settingsProfile,
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith(routePaths.settings);
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      "/ledgers/[ledgerId]/settings",
      "page",
    );
  });
});
