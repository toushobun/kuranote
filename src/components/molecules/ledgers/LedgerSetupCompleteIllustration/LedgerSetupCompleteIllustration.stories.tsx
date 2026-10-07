import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ledgerSetupCompleteMessages } from "config/ledgerSetupMessages";
import { UserThemeProvider } from "theme/UserThemeProvider";
import {
  type UserThemeKey,
  userThemeKeys,
  userThemeTokens,
} from "theme/userThemeTokens";

import { LedgerSetupCompleteIllustration } from "./LedgerSetupCompleteIllustration";

const meta = {
  title: "Molecules/Ledgers/LedgerSetupCompleteIllustration",
  component: LedgerSetupCompleteIllustration,
  args: { label: ledgerSetupCompleteMessages.illustrationLabel },
  decorators: [
    (Story) => (
      <UserThemeProvider>
        <Box sx={storyContainerSx}>
          <Story />
        </Box>
      </UserThemeProvider>
    ),
  ],
} satisfies Meta<typeof LedgerSetupCompleteIllustration>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "默认主题",
};

export const AllThemes: Story = {
  name: "全部主题",
  render: (args) => (
    <Stack direction="row" sx={themeListSx}>
      {userThemeKeys.map((themeKey) => (
        <ThemePreview key={themeKey} label={args.label} themeKey={themeKey} />
      ))}
    </Stack>
  ),
};

function ThemePreview({
  label,
  themeKey,
}: {
  label: string;
  themeKey: UserThemeKey;
}) {
  return (
    <UserThemeProvider initialThemeKey={themeKey}>
      <Stack spacing={1} sx={themePreviewSx}>
        <LedgerSetupCompleteIllustration label={label} />
        <Typography sx={themeNameSx}>
          {userThemeTokens[themeKey].name}
        </Typography>
      </Stack>
    </UserThemeProvider>
  );
}

const storyContainerSx = {
  bgcolor: "background.paper",
  p: 3,
};

const themeListSx = {
  flexWrap: "wrap",
  gap: 2,
};

const themePreviewSx = {
  alignItems: "center",
};

const themeNameSx = {
  color: "text.secondary",
  fontSize: 12,
  fontWeight: 800,
};
