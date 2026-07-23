// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createLogger } from "internal/shared/logging/logger";

describe("createLogger", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("每条日志携带 level、message 和 requestId", () => {
    const logger = createLogger("req-1");

    logger.info("hello", { userId: "u1" });

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "info",
        message: "hello",
        requestId: "req-1",
        userId: "u1",
      }),
    );
  });

  it.each([
    ["password", "hunter2"],
    ["token", "abc123"],
    ["inviteToken", "abc123"],
    ["cookie", "session=abc"],
    ["accessToken", "abc123"],
    ["apiKey", "sk-xxx"],
    ["connectionString", "postgres://user:pass@host"],
  ])("字段名匹配敏感模式（%s）时脱敏为 [REDACTED]", (fieldName, value) => {
    const logger = createLogger("req-1");

    logger.error("failed", { [fieldName]: value });

    const loggedEntry = errorSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(loggedEntry[fieldName]).toBe("[REDACTED]");
  });

  it("脱敏嵌套对象内的敏感字段", () => {
    const logger = createLogger("req-1");

    logger.warn("nested", { auth: { password: "hunter2", userId: "u1" } });

    const loggedEntry = warnSpy.mock.calls[0]?.[0] as {
      auth: { password: string; userId: string };
    };
    expect(loggedEntry.auth.password).toBe("[REDACTED]");
    expect(loggedEntry.auth.userId).toBe("u1");
  });

  it("不脱敏正常业务字段", () => {
    const logger = createLogger("req-1");

    logger.info("ok", { ledgerId: "ledger-1", userId: "u1" });

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({ ledgerId: "ledger-1", userId: "u1" }),
    );
  });
});
