"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PrimaryActionButton } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { ledgerSetupPreviewPageMessages } from "config/ledgerSetupMessages";
import { LedgerSetupWizard } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupWizard";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";
import type {
  LedgerSetupBasicInfoStateAction,
  LedgerSetupDraftSaveAction,
  LedgerSetupWizardView,
} from "types/ledgers";

type LedgerSetupPreviewTemplateProps = LedgerSetupWizardView & {
  saveDraftAction: LedgerSetupDraftSaveAction;
  submitBasicInfoAction: LedgerSetupBasicInfoStateAction;
};

/**
 * 创建账本向导的验收预览页（仅非生产环境，#395 实施拆分第 8 项移除）。
 * 打开页面即显示向导；关闭后刷新数据，重新打开时从最新进度恢复。
 */
export function LedgerSetupPreviewTemplate({
  defaults,
  progress,
  saveDraftAction,
  submitBasicInfoAction,
}: LedgerSetupPreviewTemplateProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  function closeWizard() {
    setOpen(false);
    router.refresh();
  }

  return (
    <SettingsPageLayout
      subtitle={ledgerSetupPreviewPageMessages.description}
      title={ledgerSetupPreviewPageMessages.title}
    >
      <PrimaryActionButton fullWidth onClick={() => setOpen(true)}>
        {ledgerSetupPreviewPageMessages.open}
      </PrimaryActionButton>
      {open ? (
        <LedgerSetupWizard
          actions={{
            saveDraft: saveDraftAction,
            submitBasicInfo: submitBasicInfoAction,
          }}
          defaults={defaults}
          onClose={closeWizard}
          open
          progress={progress}
        />
      ) : null}
    </SettingsPageLayout>
  );
}
