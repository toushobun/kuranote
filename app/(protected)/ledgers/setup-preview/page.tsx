import { notFound } from "next/navigation";

import { submitLedgerSetupBasicInfo } from "internal/ledger/adapter/next/actions/ledgerSetup";
import { loadLedgerSetupWizard } from "internal/ledger/adapter/next/loadLedgerSetupWizard";
import { LedgerSetupPreviewTemplate } from "templates/ledgers/LedgerSetupPreview";

/**
 * 只在非生产环境开放：Vercel Preview 或本地开发 / 测试。
 * 生产构建（Vercel Production 与本地 next start）一律 404。
 */
function isPreviewEnabled() {
  return (
    process.env.VERCEL_ENV === "preview" ||
    process.env.NODE_ENV !== "production"
  );
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
