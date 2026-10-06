import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DataItemCard, dataItemCardPadding } from "./DataItemCard";

const meta = {
  title: "Atoms/UI/DataItemCard",
  component: DataItemCard,
} satisfies Meta<typeof DataItemCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "默认",
  args: {
    children: <Typography>账户、账本、分类、商家等数据卡片内容</Typography>,
  },
};

export const ClickableWithoutPadding: Story = {
  name: "整卡可点击（disablePadding）",
  args: {
    disablePadding: true,
    sx: { overflow: "hidden" },
    children: (
      <ButtonBase
        sx={{
          justifyContent: "flex-start",
          p: dataItemCardPadding,
          textAlign: "left",
          width: "100%",
        }}
      >
        <Typography>点击整张卡片进入详情</Typography>
      </ButtonBase>
    ),
  },
};
