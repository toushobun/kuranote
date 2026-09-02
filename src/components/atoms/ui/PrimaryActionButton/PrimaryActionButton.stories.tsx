import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { ThemeProvider } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CSSProperties } from "react";

import { createDynamicMuiTheme } from "providers/DynamicMuiThemeProvider";
import { getUserThemeCssVariables } from "theme/userThemeCssVariables";
import { type UserThemeKey, userThemeTokens } from "theme/userThemeTokens";

import { PrimaryActionButton } from "./PrimaryActionButton";

const previewThemeKeys = [
  "amberWarmth",
  "emeraldMorning",
  "deepSeaStarlight",
] as const satisfies readonly UserThemeKey[];

function PrimaryActionButtonThemePreview() {
  return (
    <Stack spacing={1.5}>
      {previewThemeKeys.map((themeKey) => {
        const token = userThemeTokens[themeKey];

        return (
          <ThemeProvider key={themeKey} theme={createDynamicMuiTheme(themeKey)}>
            <Box
              style={getUserThemeCssVariables(themeKey) as CSSProperties}
              sx={{
                bgcolor: "background.default",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                p: 2,
              }}
            >
              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 700 }}>{token.name}</Typography>
                <Stack direction="row" spacing={1}>
                  <PrimaryActionButton>保存修改</PrimaryActionButton>
                  <PrimaryActionButton disabled>禁用状态</PrimaryActionButton>
                </Stack>
              </Stack>
            </Box>
          </ThemeProvider>
        );
      })}
    </Stack>
  );
}

const meta = {
  title: "Atoms/UI/PrimaryActionButton",
  component: PrimaryActionButton,
} satisfies Meta<typeof PrimaryActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "默认",
  args: {
    children: "保存修改",
  },
};

export const Disabled: Story = {
  name: "禁用状态",
  args: {
    children: "保存修改",
    disabled: true,
  },
};

export const MultipleThemes: Story = {
  name: "多主题文字对比",
  render: () => <PrimaryActionButtonThemePreview />,
};
