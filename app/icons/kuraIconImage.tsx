import { ImageResponse } from "next/og";

import { typographyFontFamilies } from "theme/typographyTokens";

type KuraIconImageOptions = {
  borderRadius: number;
  fontSize: number;
  markSize: number;
  size: number;
};

// PWA 图标不处于用户主题上下文中，因此使用 KuraNote 默认品牌色，不随主题动态变化。
const pwaIconColors = {
  background: "#FDF8F0",
  brand: "#F5A535",
  text: "#3D2E22",
} as const;

export function createKuraIconImageResponse({
  borderRadius,
  fontSize,
  markSize,
  size,
}: KuraIconImageOptions) {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: pwaIconColors.background,
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: pwaIconColors.brand,
          borderRadius,
          color: pwaIconColors.text,
          display: "flex",
          fontFamily: typographyFontFamilies.brand,
          fontSize,
          fontWeight: 800,
          height: markSize,
          justifyContent: "center",
          width: markSize,
        }}
      >
        K
      </div>
    </div>,
    {
      height: size,
      width: size,
    },
  );
}
