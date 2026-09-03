import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { ThemeProvider } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CSSProperties } from "react";

import { createDynamicMuiTheme } from "providers/DynamicMuiThemeProvider";
import { getUserThemeCssVariables } from "theme/userThemeCssVariables";
import { userThemeKeys, userThemeTokens } from "theme/userThemeTokens";

import { SelectableFilterTag } from "./SelectableFilterTag";

function SelectableFilterTagThemePreview() {
  return (
    <Stack spacing={1.5}>
      {userThemeKeys.map((themeKey) => {
        const token = userThemeTokens[themeKey];

        return (
          <ThemeProvider
            key={themeKey}
            theme={createDynamicMuiTheme(themeKey)}
          >
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
                  <SelectableFilterTag
                    ariaLabel="超市，6 个商家"
                    count={6}
                    href="/merchants?tagId=tag-1"
                    icon="🛒"
                    label="超市"
                  />
                  <SelectableFilterTag
                    ariaLabel="餐饮，4 个商家"
                    count={4}
                    href="/merchants?tagId=tag-2"
                    icon="🍽️"
                    label="餐饮"
                    selected
                  />
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
  title: "Molecules/UI/SelectableFilterTag",
  component: SelectableFilterTag,
  args: {
    ariaLabel: "超市，6 个商家",
    count: 6,
    href: "/merchants?tagId=tag-1",
    icon: "🛒",
    label: "超市",
  },
} satisfies Meta<typeof SelectableFilterTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "默认",
};

export const Selected: Story = {
  args: {
    selected: true,
  },
  name: "选中态",
};

export const MultipleThemes: Story = {
  name: "全部个人主题对比",
  render: () => <SelectableFilterTagThemePreview />,
};
