// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    "**/.next/**",
    "out/**",
    "build/**",
    "**/next-env.d.ts",
    // Storybook build output:
    "storybook-static/**",
    // Supabase CLI generated runtime files:
    "supabase/.temp/**",
  ]),
  ...storybook.configs["flat/recommended"],
  {
    rules: {
      // MUI 9 已移除 Typography 的 system props，点路径 color 不生成任何颜色（#894）。
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXOpeningElement[name.name='Typography'] > JSXAttribute[name.name='color'] Literal[value=/\\./]",
          message:
            'Typography 的 color 不支持点路径（如 "text.secondary"），请改用 "textSecondary" / "error" 等，或 sx={{ color: "..." }}。',
        },
      ],
    },
  },
]);

export default eslintConfig;
