import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WizardActionBar } from "molecules/ui/WizardActionBar/WizardActionBar";
import { WizardDialog } from "./WizardDialog";
import { WizardStepLayout } from "./WizardStepLayout";

const meta = {
  title: "Molecules/UI/WizardDialog",
  component: WizardDialog,
  args: {
    title: "预设选择",
    closeLabel: "关闭",
    onClose: () => {},
    open: true,
    children: (
      <WizardStepLayout
        actions={
          <WizardActionBar
            previous={{ label: "取消", onClick: () => {} }}
            next={{ label: "下一步" }}
          />
        }
      >
        <Typography>
          内容区滚动，底部操作栏固定。标题栏预留顶部安全区。
        </Typography>
      </WizardStepLayout>
    ),
  },
} satisfies Meta<typeof WizardDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithHeaderContent: Story = {
  args: {
    headerContent: <Typography sx={{ textAlign: "center" }}>1 / 3</Typography>,
  },
};
export const Submitting: Story = {
  args: {
    disabled: true,
    children: (
      <WizardStepLayout
        actions={
          <WizardActionBar
            previous={{ label: "取消", disabled: true, onClick: () => {} }}
            next={{ label: "添加", loading: true, loadingLabel: "添加中…" }}
          />
        }
      >
        <Typography>提交期间禁止关闭。</Typography>
      </WizardStepLayout>
    ),
  },
};
export const WithoutTitle: Story = {
  args: { title: undefined, ariaLabel: "操作完成" },
};
export const WithBack: Story = {
  args: { back: { label: "返回", onClick: () => {} } },
};
