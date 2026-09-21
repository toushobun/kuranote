import { executeDataImportBatch } from "internal/dataImport/adapter/next/actions";
import { loadDataImportHolderMembers } from "internal/dataImport/adapter/next/loadDataImportHolderMembers";
import { DataImportTemplate } from "templates/settings/DataImport";

// 「开始导入」的 Server Action 挂在本页面路由上，每批最多 importBatchSize 个单元，
// 数据库远端延迟较高时单批可能超过平台默认时限，因此显式放宽到 60 秒。
export const maxDuration = 60;

export default async function SettingsDataImportRoute() {
  const holderMembers = await loadDataImportHolderMembers();

  return (
    <DataImportTemplate
      executeBatchAction={executeDataImportBatch}
      holderMembers={holderMembers}
    />
  );
}
