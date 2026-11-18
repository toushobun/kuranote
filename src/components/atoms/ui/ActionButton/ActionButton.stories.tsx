import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { actionPendingMessages } from "config/actionPendingMessages";
import { designTokens } from "theme/theme";

import { ActionButton } from "./ActionButton";

const pillSx = { borderRadius: `${designTokens.radius.full}px` } as const;

const meta = {
  title: "Atoms/UI/ActionButton",
  component: ActionButton,
  args: {
    children: "保存",
    pendingLabel: actionPendingMessages.save,
    variant: "contained",
    sx: pillSx,
  },
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "主按钮" };
export const Pending: Story = { name: "主按钮处理中", args: { pending: true } };
export const Disabled: Story = {
  name: "主按钮不可用",
  args: { disabled: true },
};
export const Variants: Story = {
  name: "主按钮 / 描边 / 危险 × 常态 / 处理中 / 不可用",
  render: () => (
    <Stack spacing={2}>
      {(
        [
          {
            label: "主按钮",
            variant: "contained" as const,
            color: "primary" as const,
          },
          {
            label: "描边",
            variant: "outlined" as const,
            color: "primary" as const,
          },
          {
            label: "危险",
            variant: "outlined" as const,
            color: "error" as const,
          },
        ] as const
      ).map(({ label, variant, color }) => (
        <Stack spacing={1} key={label}>
          <Typography variant="subtitle2">{label}</Typography>
          <Stack direction="row" spacing={1}>
            <ActionButton
              variant={variant}
              color={color}
              sx={pillSx}
              pendingLabel={actionPendingMessages.save}
            >
              保存
            </ActionButton>
            <ActionButton
              variant={variant}
              color={color}
              sx={pillSx}
              pending
              pendingLabel={actionPendingMessages.save}
            >
              保存
            </ActionButton>
            <ActionButton
              variant={variant}
              color={color}
              sx={pillSx}
              disabled
              pendingLabel={actionPendingMessages.save}
            >
              保存
            </ActionButton>
          </Stack>
        </Stack>
      ))}
    </Stack>
  ),
};
