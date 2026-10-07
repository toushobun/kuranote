"use client";

import Box from "@mui/material/Box";

import { useUserTheme } from "theme/UserThemeProvider";
import { userThemeTokens } from "theme/userThemeTokens";

type LedgerSetupCompleteIllustrationProps = {
  /** 无障碍名称（插画的含义由所在画面决定）。 */
  label: string;
};

/**
 * 创建账本完成页的扁平插画：打开的账本、小星星、硬币与小爱心。
 * 以代码内 SVG 绘制（不使用位图），颜色取当前用户主题的 token，
 * 账本跟随主题强调色（默认主题为橙色）。
 */
export function LedgerSetupCompleteIllustration({
  label,
}: LedgerSetupCompleteIllustrationProps) {
  const { themeKey } = useUserTheme();
  const { palette, semantic } = userThemeTokens[themeKey];

  return (
    <Box
      aria-label={label}
      component="svg"
      role="img"
      sx={rootSx}
      viewBox="0 0 220 170"
    >
      {/* 背景光晕 */}
      <ellipse cx="110" cy="92" fill={palette.accentPale} rx="92" ry="68" />
      <ellipse cx="110" cy="146" fill={palette.surfaceAlt} rx="66" ry="8" />

      {/* 打开的账本：封面 */}
      <path
        d="M30 62 Q30 54 38 54 L106 60 L110 138 L40 132 Q32 131 32 123 Z"
        fill={palette.accentDeep}
      />
      <path
        d="M190 62 Q190 54 182 54 L114 60 L110 138 L180 132 Q188 131 188 123 Z"
        fill={palette.accentDeep}
      />
      {/* 内页 */}
      <path
        d="M38 58 Q72 50 108 64 L110 132 Q74 120 40 126 Z"
        fill={palette.surface}
      />
      <path
        d="M182 58 Q148 50 112 64 L110 132 Q146 120 180 126 Z"
        fill={palette.surface}
      />
      {/* 书脊 */}
      <path d="M108 64 L110 134 L112 64 Z" fill={palette.accent} />
      {/* 左页：账目线条 */}
      <g
        fill="none"
        stroke={palette.accentLight}
        strokeLinecap="round"
        strokeWidth="4"
      >
        <path d="M52 76 Q74 72 96 79" />
        <path d="M52 90 Q72 86 92 92" />
        <path d="M52 104 Q68 101 84 105" />
      </g>
      {/* 右页：对勾 */}
      <path
        d="M134 92 L146 104 L166 80"
        fill="none"
        stroke={palette.accent}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="7"
      />

      {/* 硬币 */}
      <circle cx="176" cy="38" fill={semantic.warningBg} r="15" />
      <circle
        cx="176"
        cy="38"
        fill="none"
        r="15"
        stroke={semantic.warning}
        strokeWidth="3"
      />
      <circle
        cx="176"
        cy="38"
        fill="none"
        r="8"
        stroke={semantic.warning}
        strokeWidth="2.5"
      />

      {/* 小爱心 */}
      <path
        d="M42 42 C42 36 50 34 52 40 C54 34 62 36 62 42 C62 49 52 54 52 54 C52 54 42 49 42 42 Z"
        fill={semantic.expense}
      />

      {/* 小星星 */}
      <path
        d="M104 14 L107 24 L117 27 L107 30 L104 40 L101 30 L91 27 L101 24 Z"
        fill={palette.accentLight}
      />
      <path
        d="M146 18 L148 23 L153 25 L148 27 L146 32 L144 27 L139 25 L144 23 Z"
        fill={palette.accent}
      />
      <path
        d="M24 92 L26 97 L31 99 L26 101 L24 106 L22 101 L17 99 L22 97 Z"
        fill={palette.accentLight}
      />
      <path
        d="M200 96 L202 101 L207 103 L202 105 L200 110 L198 105 L193 103 L198 101 Z"
        fill={semantic.warning}
      />
    </Box>
  );
}

const rootSx = {
  display: "block",
  flexShrink: 0,
  height: { xs: 150, sm: 170 },
  width: { xs: 194, sm: 220 },
};
