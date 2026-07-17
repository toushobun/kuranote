export type Logger = {
  error: (message: string, fields?: Record<string, unknown>) => void;
  warn: (message: string, fields?: Record<string, unknown>) => void;
  info: (message: string, fields?: Record<string, unknown>) => void;
};

/**
 * 结构化服务端日志。禁止记录密码、Cookie、Access Token、邀请 Token、
 * 密钥、数据库连接信息等敏感内容——调用方负责脱敏后再传入 fields。
 */
export function createLogger(requestId: string): Logger {
  function log(
    level: "error" | "warn" | "info",
    message: string,
    fields: Record<string, unknown> = {},
  ) {
    const entry = { level, message, requestId, ...fields };

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
