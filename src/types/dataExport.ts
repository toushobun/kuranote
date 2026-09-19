import type { DataExport } from "internal/dataExport";
import type { BaseActionState } from "types/auth";

export type DataExportActionState = BaseActionState & {
  errorKey?: string;
  data?: DataExport;
};
export type DataExportAction = () => Promise<DataExportActionState>;
