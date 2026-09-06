import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { ThemeProvider } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CSSProperties } from "react";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";
import { createDynamicMuiTheme } from "providers/DynamicMuiThemeProvider";
import { getUserThemeCssVariables } from "theme/userThemeCssVariables";
import { userThemeKeys, userThemeTokens } from "theme/userThemeTokens";

import { MerchantCard } from "./MerchantCard";

const merchant = createMerchantRow({
  aliases: [
    createMerchantAliasRow({ is_preferred: true }),
    createMerchantAliasRow({ alias: "LIFE", id: "alias-2", sort_order: 2 }),
  ],
  display_name: "来福",
  note: "常去的超市",
  tags: [
    {
      icon: "🛒",
      id: "tag-supermarket",
      merchant_count: 1,
      name: "超市",
      sort_order: 1,
    },
  ],
});

function MerchantCardThemePreview() {
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
                <MerchantCard
                  editHref="/merchants/merchant-1/edit"
                  ledgerId="ledger-1"
                  merchant={merchant}
                />
              </Stack>
            </Box>
          </ThemeProvider>
        );
      })}
    </Stack>
  );
}

const meta = {
  title: "Organisms/Merchants/MerchantCard",
  component: MerchantCard,
  args: {
    editHref: "/merchants/merchant-1/edit",
    ledgerId: "ledger-1",
    merchant,
  },
} satisfies Meta<typeof MerchantCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "首选别名、纹理与分隔线",
};

export const WithoutAliases: Story = {
  name: "无别名",
  args: {
    editHref: "/merchants/merchant-1/edit",
    ledgerId: "ledger-1",
    merchant: createMerchantRow({ aliases: [] }),
  },
};

export const MultipleThemes: Story = {
  name: "全部个人主题对比",
  render: () => <MerchantCardThemePreview />,
};
