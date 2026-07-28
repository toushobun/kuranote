import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SectionCard } from "./SectionCard";

const meta = {
  title: "Molecules/UI/SectionCard",
  component: SectionCard,
  args: {
    children: "区块内容",
  },
} satisfies Meta<typeof SectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "基本卡片",
  render: () => (
    <SectionCard sx={{ maxWidth: 420 }}>
      <Stack spacing={0.75}>
        <Typography sx={{ fontWeight: 900 }}>本月概览</Typography>
        <Typography color="text.secondary" variant="body2">
          用于承载页面中的独立信息区块。
        </Typography>
      </Stack>
    </SectionCard>
  ),
};

export const WithAction: Story = {
  name: "带操作内容",
  render: () => (
    <SectionCard sx={{ maxWidth: 420 }}>
      <Stack spacing={1.5}>
        <Typography sx={{ fontWeight: 900 }}>家庭账本</Typography>
        <Typography color="text.secondary" variant="body2">
          当前共有 3 位成员共同记账。
        </Typography>
        <Button size="small" variant="outlined">
          查看详情
        </Button>
      </Stack>
    </SectionCard>
  ),
};
