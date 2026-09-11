import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { UserThemeProvider } from "theme/UserThemeProvider";

import { DestructiveSubmitButton } from "./DestructiveSubmitButton";

const meta = {
  title: "Molecules/UI/DestructiveSubmitButton",
  component: DestructiveSubmitButton,
  decorators: [
    (Story) => (
      <UserThemeProvider storageScope="storybook-destructive-submit-button">
        <ConfirmDialogProvider>
          <form onSubmit={(event) => event.preventDefault()}>
            <Story />
          </form>
        </ConfirmDialogProvider>
      </UserThemeProvider>
    ),
  ],
  args: {
    confirmLabel: "删除账户",
    description: "删除后该账户将从账户列表中隐藏，历史记录不会被删除。",
    label: "删除账户",
    title: "删除账户？",
  },
} satisfies Meta<typeof DestructiveSubmitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "破坏性操作确认按钮",
};
