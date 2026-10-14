import DialogContent from "@mui/material/DialogContent";
import type { ReactNode } from "react";

type WizardStepLayoutProps = {
  /** 底部固定操作栏，通常为 WizardActionBar。 */
  actions: ReactNode;
  children: ReactNode;
};

/** 向导步骤的布局：可滚动的内容区 + 底部固定操作栏。内容区底部预留留白，避免贴住操作栏。 */
export function WizardStepLayout({ actions, children }: WizardStepLayoutProps) {
  return (
    <>
      <DialogContent sx={contentSx}>{children}</DialogContent>
      {actions}
    </>
  );
}

const contentSx = {
  pb: 4,
  pt: 2.5,
  px: { xs: 2, sm: 3 },
};
