import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import Button from "@mui/material/Button";

import { CategoryDialogActions } from "./CategoryDialogActions";

const meta = {
  title: "Organisms/Categories/CategoryDialogActions",
  component: CategoryDialogActions,
  args: { onCancel: () => {}, submitLabel: "保存" },
} satisfies Meta<typeof CategoryDialogActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "左右等宽操作" };
export const Disabled: Story = { name: "不可提交", args: { disabled: true } };

export const Create: Story = {
  name: "新增分类操作",
  args: { submitLabel: "新增分类" },
};

export const WithArchive: Story = {
  name: "归档独立一行",
  args: {
    children: (
      <Button
        color="error"
        fullWidth
        startIcon={<ArchiveRoundedIcon />}
        variant="outlined"
      >
        归档该分类
      </Button>
    ),
  },
};
