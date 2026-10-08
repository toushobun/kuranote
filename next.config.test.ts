import { describe, expect, it } from "vitest";

import nextConfig from "./next.config";

describe("next.config redirects", () => {
  it("旧的 /ledgers/new 链接临时重定向到账本管理页", async () => {
    const redirects = await nextConfig.redirects?.();

    expect(redirects).toContainEqual({
      destination: "/ledgers",
      permanent: false,
      source: "/ledgers/new",
    });
  });
});
