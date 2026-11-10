const cjkCharacter =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

/**
 * 账户默认图标的文字（#1050）：中文 / 日文 / 韩文开头取前两个字（忽略空格），
 * 其余取首字母（两个以上单词取前两个单词的首字母），字母一律大写。
 */
export function accountAvatarText(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const characters = Array.from(words.join(""));
  const first = characters[0];
  if (!first) return "";
  if (cjkCharacter.test(first)) return characters.slice(0, 2).join("");
  const initials =
    words.length > 1
      ? words.slice(0, 2).map((word) => Array.from(word)[0])
      : [first];
  return initials.join("").toUpperCase();
}
