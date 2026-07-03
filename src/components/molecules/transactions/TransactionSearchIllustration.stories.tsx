import { useEffect, type ReactNode } from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { useUserTheme, UserThemeProvider } from "theme/UserThemeProvider";
import {
  type UserThemeKey,
  userThemeKeys,
  userThemeTokens,
} from "theme/userThemeTokens";

import {
  TransactionSearchIllustration,
  type TransactionSearchIllustrationVariant,
} from "./TransactionSearchIllustration";

const meta = {
  title: "Molecules/Transactions/TransactionSearchIllustration",
  component: TransactionSearchIllustration,
  args: {
    variant: "guide",
  },
  decorators: [
    (Story) => (
      <UserThemeProvider storageScope="storybook-search-illustration-default">
        <Box sx={storyContainerSx}>
          <Story />
        </Box>
      </UserThemeProvider>
    ),
  ],
} satisfies Meta<typeof TransactionSearchIllustration>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Guide: Story = {
  name: "输入关键词引导",
  args: { variant: "guide" },
};

export const Empty: Story = {
  name: "无搜索结果",
  args: { variant: "empty" },
};

export const AllThemes: Story = {
  name: "全部主题",
  render: () => (
    <Stack spacing={3}>
      {userThemeKeys.map((themeKey) => (
        <ThemePreview key={themeKey} themeKey={themeKey} />
      ))}
    </Stack>
  ),
};

function ThemePreview({ themeKey }: { themeKey: UserThemeKey }) {
  return (
    <UserThemeProvider
      storageScope={`storybook-search-illustration-${themeKey}`}
    >
      <ThemeSetter themeKey={themeKey}>
        <Box sx={themePreviewSx}>
          <Typography sx={themeNameSx}>
            {userThemeTokens[themeKey].name}
          </Typography>
          <Stack direction="row" spacing={2} sx={variantRowSx}>
            <VariantPreview label="输入关键词" variant="guide" />
            <VariantPreview label="无搜索结果" variant="empty" />
          </Stack>
        </Box>
      </ThemeSetter>
    </UserThemeProvider>
  );
}

function ThemeSetter({
  children,
  themeKey,
}: {
  children: ReactNode;
  themeKey: UserThemeKey;
}) {
  const { setThemeKey } = useUserTheme();

  useEffect(() => {
    setThemeKey(themeKey);
  }, [setThemeKey, themeKey]);

  return children;
}

function VariantPreview({
  label,
  variant,
}: {
  label: string;
  variant: TransactionSearchIllustrationVariant;
}) {
  return (
    <Stack spacing={1} sx={variantPreviewSx}>
      <TransactionSearchIllustration variant={variant} />
      <Typography sx={variantLabelSx}>{label}</Typography>
    </Stack>
  );
}

const storyContainerSx = {
  bgcolor: "var(--user-theme-tx-page-bg)",
  minHeight: "100vh",
  p: 3,
};

const themePreviewSx = {
  bgcolor: "var(--user-theme-card-bg)",
  border: "1px solid var(--user-theme-card-border)",
  borderRadius: 4,
  p: 2,
};

const themeNameSx = {
  color: "var(--user-theme-tx-name)",
  fontSize: 15,
  fontWeight: 900,
  mb: 1.5,
};

const variantRowSx = {
  alignItems: "center",
  flexWrap: "wrap",
};

const variantPreviewSx = {
  alignItems: "center",
  minWidth: 220,
};

const variantLabelSx = {
  color: "text.secondary",
  fontSize: 12,
  fontWeight: 800,
};
