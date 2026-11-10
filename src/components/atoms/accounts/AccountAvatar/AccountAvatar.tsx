"use client";

import { useState } from "react";
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
  iconUrl,
  name,
  size,
}: {
  id: string;
  iconUrl?: string | null;
  name: string;
  size: number;
}) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const showIcon = iconUrl && iconUrl !== failedUrl;
  const tone = avatarToneFor(id);
  const text = accountAvatarText(name);
  return (
    <Box
      aria-hidden
      sx={{
        alignItems: "center",
        bgcolor: showIcon ? "background.paper" : tone.backgroundColor,
        border: "1px solid",
        borderColor: showIcon ? "divider" : tone.borderColor,
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
      {showIcon ? (
        <Box
          key={iconUrl}
          alt=""
          component="img"
          onError={() => setFailedUrl(iconUrl)}
          src={iconUrl}
          sx={{ height: "75%", objectFit: "contain", width: "75%" }}
        />
      ) : (
        text
      )}
    </Box>
  );
}
