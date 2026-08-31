"use client";

import { deepOrange, lightGreen, pink } from "@mui/material/colors";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { alpha } from "@mui/material/styles";
import { useState } from "react";

import { publicAssetUrl } from "utils/publicAssetUrl";

type MerchantAvatarSize = number | { sm: number; xs: number };

type MerchantAvatarProps = {
  loading?: boolean;
  onError?: () => void;
  onLoad?: () => void;
  padding?: number;
  size: MerchantAvatarSize;
  src?: string;
  toneKey: string;
};

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

function avatarToneFor(toneKey: string) {
  const toneIndex = Array.from(toneKey).reduce(
    (hash, character) => (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0,
    0,
  );

  return avatarTones[toneIndex % avatarTones.length];
}

export function MerchantAvatar({
  loading = false,
  onError,
  onLoad,
  padding = 0.75,
  size,
  src,
  toneKey,
}: MerchantAvatarProps) {
  const avatarTone = avatarToneFor(toneKey);
  const [loadedSrc, setLoadedSrc] = useState<string>();

  return (
    <Box
      sx={{
        display: "inline-flex",
        flexShrink: 0,
        height: size,
        position: "relative",
        width: size,
      }}
    >
      <Avatar
        alt=""
        sx={{
          bgcolor: avatarTone.backgroundColor,
          border: "1px solid",
          borderColor: avatarTone.borderColor,
          color: avatarTone.color,
          height: "100%",
          p: padding,
          width: "100%",
        }}
      >
        <Box
          alt=""
          component="img"
          src={publicAssetUrl("/assets/kura-icons/merchant.png")}
          sx={{ height: "100%", objectFit: "contain", width: "100%" }}
        />
        {src ? (
          <Box
            alt=""
            className="MerchantAvatar-image"
            component="img"
            onError={() => {
              setLoadedSrc(undefined);
              onError?.();
            }}
            onLoad={() => {
              setLoadedSrc(src);
              onLoad?.();
            }}
            src={src}
            sx={{
              bgcolor: avatarTone.backgroundColor,
              height: "100%",
              inset: 0,
              objectFit: "contain",
              opacity: loadedSrc === src ? 1 : 0,
              p: padding,
              position: "absolute",
              width: "100%",
            }}
          />
        ) : null}
      </Avatar>
      {loading ? (
        <Box
          sx={{
            alignItems: "center",
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.72),
            borderRadius: "50%",
            display: "flex",
            inset: 0,
            justifyContent: "center",
            position: "absolute",
          }}
        >
          <CircularProgress aria-label="正在获取商家头像" size={28} />
        </Box>
      ) : null}
    </Box>
  );
}
