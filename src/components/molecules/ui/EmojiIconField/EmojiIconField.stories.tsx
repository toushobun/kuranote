import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { ThemeProvider } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { type CSSProperties, useState } from "react";

import { createDynamicMuiTheme } from "providers/DynamicMuiThemeProvider";
import { getUserThemeCssVariables } from "theme/userThemeCssVariables";
import { userThemeKeys, userThemeTokens } from "theme/userThemeTokens";

import { EmojiIconField } from "./EmojiIconField";

const emojiIconFieldArgs = {
  fieldLabel: "标签图标",
  groups: [{ id: "shop", label: "零售" }],
  helperText: "选择一个便于识别的 Emoji。",
  inputName: "icon",
  onChange: () => {},
  options: [
    { emoji: "🛒", groupId: "shop", keywords: ["采购"], label: "超市" },
    { emoji: "🏪", groupId: "shop", keywords: ["商店"], label: "便利店" },
  ],
  searchPlaceholder: "例如：超市",
  value: "🛒",
};

function EmojiIconFieldThemePreview() {
  return (
    <Stack spacing={1.5}>
      {userThemeKeys.map((themeKey) => {
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
                <EmojiIconField {...emojiIconFieldArgs} />
              </Stack>
            </Box>
          </ThemeProvider>
        );
      })}
    </Stack>
  );
}

const meta = {
  title: "Molecules/UI/EmojiIconField",
  component: EmojiIconField,
  args: emojiIconFieldArgs,
  render: function EmojiIconFieldStory(args) {
    const [value, setValue] = useState(args.value);
    return <EmojiIconField {...args} onChange={setValue} value={value} />;
  },
} satisfies Meta<typeof EmojiIconField>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "Emoji 选择器" };

export const MultipleThemes: Story = {
  name: "全部个人主题对比",
  render: () => <EmojiIconFieldThemePreview />,
};
