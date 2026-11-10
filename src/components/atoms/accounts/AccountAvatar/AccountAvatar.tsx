import Box from "@mui/material/Box";

import { avatarToneFor } from "theme/avatarTones";
import { designTokens } from "theme/theme";
import { accountAvatarText } from "utils/accountAvatarText";

/**
 * 账户的默认图标（#1050）：账户名的文字图标，圆角方形以区别于商家的圆形头像；
 * 颜色按账户 id 固定，与商家头像共用一套配色。
 */
export function AccountAvatar({
  id,
  name,
  size,
}: {
  id: string;
  name: string;
  size: number;
}) {
  const tone = avatarToneFor(id);
  const text = accountAvatarText(name);
  return (
    <Box
      aria-hidden
      sx={{
        alignItems: "center",
        bgcolor: tone.backgroundColor,
        border: "1px solid",
        borderColor: tone.borderColor,
        borderRadius: `${size >= 40 ? designTokens.radius.item : designTokens.radius.sm}px`,
        color: tone.color,
        display: "inline-flex",
        flexShrink: 0,
        fontSize: size * (Array.from(text).length > 1 ? 0.34 : 0.44),
        fontWeight: 800,
        height: size,
        justifyContent: "center",
        letterSpacing: 0,
        lineHeight: 1,
        overflow: "hidden",
        whiteSpace: "nowrap",
        width: size,
      }}
    >
      {text}
    </Box>
  );
}
