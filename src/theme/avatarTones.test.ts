import { describe, expect, it } from "vitest";

import { avatarToneFor } from "./avatarTones";

describe("avatarToneFor", () => {
  it("同一标识总是得到同一种配色", () => {
    expect(avatarToneFor("account-1")).toBe(avatarToneFor("account-1"));
  });

  it("不同标识分散到不同配色", () => {
    const tones = new Set(
      ["a", "b", "c", "d", "e", "f"].map((key) => avatarToneFor(key)),
    );
    expect(tones.size).toBeGreaterThan(1);
  });
});
