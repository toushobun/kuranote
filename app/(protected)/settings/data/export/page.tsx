import { exportCurrentLedgerData } from "internal/dataExport/adapter/next/actions";
import { DataExportTemplate } from "templates/settings/DataExport/DataExport";

export default function SettingsDataExportRoute() {
  return <DataExportTemplate exportAction={exportCurrentLedgerData} />;
}
