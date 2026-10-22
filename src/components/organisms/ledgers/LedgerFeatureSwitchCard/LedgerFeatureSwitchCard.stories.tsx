import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LedgerFeatureSwitchCard } from "./LedgerFeatureSwitchCard";

const meta = {
  title: "Organisms/Ledgers/LedgerFeatureSwitchCard",
  component: LedgerFeatureSwitchCard,
  args: {
    description: "功能的简短说明。",
    enabled: true,
    icon: <ReceiptLongRoundedIcon />,
    onChange: () => undefined,
    sectionTitle: "账本功能",
    switchLabel: "启用功能",
  },
} satisfies Meta<typeof LedgerFeatureSwitchCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "默认",
};

export const WithChildren: Story = {
  name: "附带补充内容",
  args: {
    children: (
      <Typography color="textSecondary" variant="body2">
        开关下方的补充说明。
      </Typography>
    ),
  },
};

export const Readonly: Story = {
  name: "普通成员只读",
  args: { canEdit: false },
};

export const Loading: Story = {
  name: "加载状态",
  args: { state: "loading" },
};

export const Error: Story = {
  name: "错误状态",
  args: { onRetry: () => undefined, state: "error" },
};
