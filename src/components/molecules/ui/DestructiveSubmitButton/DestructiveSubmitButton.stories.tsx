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
    confirmLabel: "归档",
    description: "归档后该分类不会在记账选择中显示，确定要归档吗？",
    label: "归档该分类",
    title: "归档该分类？",
  },
} satisfies Meta<typeof DestructiveSubmitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "破坏性操作确认按钮",
};
