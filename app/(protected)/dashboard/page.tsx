import { ledgerSetupWizardLauncherActions } from "internal/ledger/adapter/next/ledgerSetupWizardLauncherActions";
import { loadLedgerSetupInProgressSummary } from "internal/ledger/adapter/next/loadLedgerSetupWizard";
import { loadDashboardView } from "internal/statistics/adapter/next/loadStatisticsViews";
import { DashboardTemplate } from "templates/dashboard/Dashboard";

export default async function DashboardPage() {
  const data = await loadDashboardView();
  // 只有没有已完成账本时才需要「继续创建」，有已完成账本时不读取创建中账本。
  const setupInProgress =
    data.hasLedger === false ? await loadLedgerSetupInProgressSummary() : null;

  return (
    <DashboardTemplate
      data={data}
      setupInProgress={setupInProgress}
      setupWizardActions={ledgerSetupWizardLauncherActions}
    />
  );
}
