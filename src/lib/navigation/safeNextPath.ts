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
