import { notFound } from "next/navigation";

import { submitLedgerSetupBasicInfo } from "internal/ledger/adapter/next/actions/ledgerSetup";
import { loadLedgerSetupWizard } from "internal/ledger/adapter/next/loadLedgerSetupWizard";
import { LedgerSetupPreviewTemplate } from "templates/ledgers/LedgerSetupPreview";

/**
 * 只在本地开发 / 测试开放。项目只有一个 Supabase project（与生产共用），
 * 部署环境（包括将来可能启用的 Vercel Preview）一律 404，避免在真实数据中留下测试用的创建中账本。
 */
function isPreviewEnabled() {
  return process.env.NODE_ENV !== "production";
}

/** 创建账本向导验收预览页（#395 实施拆分第 8 项切换正式入口时移除）。 */
export default async function LedgerSetupPreviewRoute() {
  if (!isPreviewEnabled()) notFound();

  const view = await loadLedgerSetupWizard();

  return (
    <LedgerSetupPreviewTemplate
      {...view}
      submitBasicInfoAction={submitLedgerSetupBasicInfo}
    />
  );
}
