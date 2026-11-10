import { deepOrange, lightGreen, pink } from "@mui/material/colors";

// 商家头像与账户文字图标共用的配色：按标识固定选一种，同一商家 / 账户颜色不变。
const avatarTones = [
  {
    backgroundColor: deepOrange[50],
    borderColor: deepOrange[100],
    color: deepOrange[800],
  },
  {
    backgroundColor: pink[50],
    borderColor: pink[100],
    color: pink[800],
  },
  {
    backgroundColor: lightGreen[50],
    borderColor: lightGreen[200],
    color: lightGreen[800],
  },
] as const;

export function avatarToneFor(toneKey: string) {
  const toneIndex = Array.from(toneKey).reduce(
    (hash, character) => (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0,
    0,
  );

  return avatarTones[toneIndex % avatarTones.length];
}
