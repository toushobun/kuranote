import type { DataExport } from "internal/dataExport";
import type { ActionState } from "types/actions";

export type DataExportActionState = ActionState & {
  data?: DataExport;
};
export type DataExportAction = () => Promise<DataExportActionState>;
