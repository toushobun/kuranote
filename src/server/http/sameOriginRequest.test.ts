import { describe, expect, it } from "vitest";

import { isSameOriginRequest } from "server/http/sameOriginRequest";

describe("isSameOriginRequest", () => {
  it("Origin 与请求地址一致时返回 true", () => {
    const request = new Request("https://kuranote.test/api/example", {
      headers: { Origin: "https://kuranote.test" },
    });

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("Origin 与请求地址不一致时返回 false", () => {
    const request = new Request("https://kuranote.test/api/example", {
      headers: { Origin: "https://evil.test" },
    });

    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("缺少 Origin 时返回 false", () => {
    const request = new Request("https://kuranote.test/api/example");

    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("Origin 格式无效时返回 false", () => {
    const request = new Request("https://kuranote.test/api/example", {
      headers: { Origin: "://invalid" },
    });

    expect(isSameOriginRequest(request)).toBe(false);
  });
});
