export type Logger = {
  error: (message: string, fields?: Record<string, unknown>) => void;
  warn: (message: string, fields?: Record<string, unknown>) => void;
  info: (message: string, fields?: Record<string, unknown>) => void;
};

const sensitiveFieldNamePattern =
  /password|token|cookie|secret|key|authorization|connection.?string/i;

const redactedValue = "[REDACTED]";
const maxRedactionDepth = 4;

/**
 * 递归脱敏字段名匹配敏感模式（密码、Token、Cookie、密钥、数据库连接
 * 信息等）的值，避免依赖调用方每次手动脱敏。
 */
function redact(value: unknown, depth = 0): unknown {
  if (
    depth >= maxRedactionDepth ||
    value === null ||
    typeof value !== "object"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(
      ([key, fieldValue]) => [
        key,
        sensitiveFieldNamePattern.test(key)
          ? redactedValue
          : redact(fieldValue, depth + 1),
      ],
    ),
  );
}

/**
 * 结构化服务端日志。字段名匹配密码 / Token / Cookie / 密钥 /
 * 数据库连接信息等敏感模式时自动脱敏；调用方仍应避免把完整个人隐私
 * 信息放进日志字段。
 */
export function createLogger(requestId: string): Logger {
  function log(
    level: "error" | "warn" | "info",
    message: string,
    fields: Record<string, unknown> = {},
  ) {
    const entry = { level, message, requestId, ...(redact(fields) as object) };

    if (level === "error") {
      console.error(entry);
      return;
    }

    if (level === "warn") {
      console.warn(entry);
      return;
    }

    console.info(entry);
  }

  return {
    error: (message, fields) => log("error", message, fields),
    info: (message, fields) => log("info", message, fields),
    warn: (message, fields) => log("warn", message, fields),
  };
}
