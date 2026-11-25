import type { DataExport, DataExportOptions } from "internal/dataExport";
import type { ActionState } from "types/actions";

export type DataExportActionState = ActionState & {
  data?: DataExport;
  ledgerName?: string;
};
export type DataExportAction = (
  options?: DataExportOptions,
) => Promise<DataExportActionState>;
