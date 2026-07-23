import { afterEach, describe, expect, it } from "vitest";

import { isGoogleAuthEnabled } from "internal/auth/googleAuthConfig";

const originalGoogleAuthEnabled = process.env.GOOGLE_AUTH_ENABLED;

afterEach(() => {
  if (originalGoogleAuthEnabled === undefined) {
    delete process.env.GOOGLE_AUTH_ENABLED;
    return;
  }

  process.env.GOOGLE_AUTH_ENABLED = originalGoogleAuthEnabled;
});

describe("googleAuthConfig", () => {
  it("仅在环境变量为 true 时启用 Google OAuth", () => {
    process.env.GOOGLE_AUTH_ENABLED = "true";

    expect(isGoogleAuthEnabled()).toBe(true);
  });

  it.each([undefined, "false", "TRUE", "1"])(
    "环境变量为 %s 时保持禁用",
    (value) => {
      if (value === undefined) {
        delete process.env.GOOGLE_AUTH_ENABLED;
      } else {
        process.env.GOOGLE_AUTH_ENABLED = value;
      }

      expect(isGoogleAuthEnabled()).toBe(false);
    },
  );
});
