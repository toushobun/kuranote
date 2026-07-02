import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FormActions } from "./FormActions";
import { LoadingState } from "./LoadingState";
import { SectionCard } from "./SectionCard";

const meta = {
  title: "Molecules/UI/StateComponents",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  name: "LoadingState",
  render: () => (
    <LoadingState title="读取账户中" description="正在读取账户列表。" />
  ),
};

export const CardAndActions: Story = {
  name: "SectionCard + FormActions",
  render: () => (
    <SectionCard>
      <Stack spacing={2}>
        <div>表单内容区域</div>
        <FormActions>
          <Button variant="outlined">取消</Button>
          <Button variant="contained">保存</Button>
        </FormActions>
      </Stack>
    </SectionCard>
  ),
};
