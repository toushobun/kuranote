import { executeDataImportBatch } from "internal/dataImport/adapter/next/actions";
import { DataImportTemplate } from "templates/settings/DataImport";

export default function SettingsDataImportRoute() {
  return <DataImportTemplate executeBatchAction={executeDataImportBatch} />;
}
