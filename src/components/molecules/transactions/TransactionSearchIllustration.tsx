"use client";

import Box from "@mui/material/Box";
import Image from "next/image";

import { useUserTheme } from "theme/UserThemeProvider";
import { userThemeTokens } from "theme/userThemeTokens";

export type TransactionSearchIllustrationVariant = "guide" | "empty";

type TransactionSearchIllustrationProps = {
  variant: TransactionSearchIllustrationVariant;
};

const illustrationPrefixByVariant: Record<
  TransactionSearchIllustrationVariant,
  string
> = {
  empty: "empty",
  guide: "search_illustration",
};

const illustrationAltByVariant: Record<
  TransactionSearchIllustrationVariant,
  string
> = {
  empty: "搜索无结果插图",
  guide: "搜索引导插图",
};

export function TransactionSearchIllustration({
  variant,
}: TransactionSearchIllustrationProps) {
  const { themeKey } = useUserTheme();
  const themeIllustration = userThemeTokens[themeKey].illustration;
  const prefix = illustrationPrefixByVariant[variant];

  return (
    <Box data-testid={`transaction-search-illustration-${variant}`} sx={rootSx}>
      <Image
        fill
        alt={illustrationAltByVariant[variant]}
        sizes="(min-width: 600px) 220px, 190px"
        src={`/assets/kura-search/${prefix}_${themeIllustration.assetSuffix}.png`}
        style={{ objectFit: "contain" }}
      />
    </Box>
  );
}

const rootSx = {
  flexShrink: 0,
  height: { xs: 150, sm: 170 },
  position: "relative",
  width: { xs: 190, sm: 220 },
};
