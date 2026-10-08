const internalOrigin = "https://kuranote.invalid";

function hasControlCharacter(value: string) {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && (codePoint <= 31 || codePoint === 127);
  });
}

export function isSafeNextPath(value: string) {
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return false;
  }

  if (hasControlCharacter(value)) {
    return false;
  }

  try {
    const decodedValue = decodeURIComponent(value);
    if (hasControlCharacter(decodedValue)) return false;

    const parsed = new URL(decodedValue, internalOrigin);
    return parsed.origin === internalOrigin && parsed.pathname.startsWith("/");
  } catch {
    return false;
  }
}

// 取出合法的站内跳转路径；不是字符串或校验失败时返回 null，由调用方决定默认跳转。
export function getSafeNextPath(value: unknown): string | null {
  return typeof value === "string" && isSafeNextPath(value) ? value : null;
}
