import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { UserThemeProvider } from "theme/UserThemeProvider";

import { ArchiveAccountButton } from "./ArchiveAccountButton";

const meta = {
  title: "Molecules/Accounts/ArchiveAccountButton",
  component: ArchiveAccountButton,
  decorators: [
    (Story) => (
      <UserThemeProvider>
        <ConfirmDialogProvider>
          <Story />
        </ConfirmDialogProvider>
      </UserThemeProvider>
    ),
  ],
} satisfies Meta<typeof ArchiveAccountButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "归档按钮",
};
