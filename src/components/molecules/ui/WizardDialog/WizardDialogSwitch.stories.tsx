import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { WizardDialog } from "./WizardDialog";
import { WizardDialogSwitch } from "./WizardDialogSwitch";

const panes = ["从商家记账", "账户周转", "从模板记账"];

function SwitchDemo() {
  const [active, setActive] = useState(panes[0]);
  return (
    <WizardDialogSwitch
      activeKey={active}
      order={panes}
      renderPane={(key) => (
        <WizardDialog open closeLabel="关闭" title={key} onClose={() => {}}>
          <DialogContent>
            <Stack spacing={2}>
              <Typography>
                点下面的按钮切换：标题栏不动，内容按顺序左右滑动。
              </Typography>
              {panes.map((pane) => (
                <Button
                  key={pane}
                  variant={pane === key ? "contained" : "outlined"}
                  onClick={() => setActive(pane)}
                >
                  {pane}
                </Button>
              ))}
            </Stack>
          </DialogContent>
        </WizardDialog>
      )}
    />
  );
}

const meta = {
  title: "Molecules/UI/WizardDialogSwitch",
  component: SwitchDemo,
} satisfies Meta<typeof SwitchDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
