import { categoryEmojiValues } from "config/categoryEmojis";

function removeCategoryEmojiPrefix(name: string) {
  for (const emoji of categoryEmojiValues) {
    if (name.startsWith(emoji)) {
      return name.slice(emoji.length).trimStart();
    }
  }

  return name;
}

export function getCategoryDisplayName(
  name: string,
  iconName: string | null | undefined,
) {
  const normalizedName = name.trimStart();
  const normalizedIconName = iconName?.trim();

  if (normalizedIconName && normalizedName.startsWith(normalizedIconName)) {
    return normalizedName.slice(normalizedIconName.length).trimStart();
  }

  return removeCategoryEmojiPrefix(normalizedName);
}

export function getCategoryStoredName(name: string, iconName: string) {
  const normalizedIconName = iconName.trim();
  const displayName = getCategoryDisplayName(name.trim(), normalizedIconName);

  return `${normalizedIconName} ${displayName}`;
}

export function getUnicodeCharacterCount(value: string) {
  return Array.from(value).length;
}
