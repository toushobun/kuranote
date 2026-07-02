import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SectionCard } from "./SectionCard";
import { ResultFeedback } from "./ResultFeedback";

const meta = {
  title: "Molecules/UI/ResultFeedback",
  component: ResultFeedback,
  args: {
    title: "操作结果",
    message: "这里显示操作后的补充说明。",
  },
} satisfies Meta<typeof ResultFeedback>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  name: "成功：参考设计图 No.2 以外的结果反馈布局",
  args: {
    variant: "success",
    title: "保存完成",
    message: "这次操作已经保存，可以继续下一步。",
    actionLabel: "返回列表",
  },
};

export const Empty: Story = {
  name: "空结果：参考设计图 No.2 以外的结果反馈布局",
  args: {
    variant: "empty",
    title: "没有找到相关记录",
    message: "换一个条件再试试，或者先新增一条记录。",
    actionLabel: "重新筛选",
  },
};

export const Error: Story = {
  name: "错误：参考设计图 No.2 以外的结果反馈布局",
  args: {
    variant: "error",
    title: "操作没有完成",
    message: "系统暂时没有返回结果。请稍后再试。",
    actionLabel: "重试",
  },
};

export const Info: Story = {
  name: "通知：参考设计图 No.2 以外的结果反馈布局",
  args: {
    variant: "info",
    title: "正在确认内容",
    message: "确认完成后会显示最新结果。",
  },
};

export const WithCustomAction: Story = {
  name: "自定义操作",
  render: () => (
    <ResultFeedback
      variant="info"
      title="需要确认"
      message="这个操作会影响后续统计，请确认后继续。"
      action={
        <Stack direction="row" spacing={1.5}>
          <Button variant="text">取消</Button>
          <Button variant="contained">继续</Button>
        </Stack>
      }
    />
  ),
};

export const EmbeddedInSection: Story = {
  name: "卡片内嵌入",
  render: () => (
    <SectionCard>
      <ResultFeedback
        variant="empty"
        title="本区块还没有内容"
        message="组件自身控制宽度、居中和间距，不依赖页面级背景。"
        sx={{ py: 2 }}
      />
    </SectionCard>
  ),
};
